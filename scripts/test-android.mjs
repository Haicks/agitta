/** Smoke-test an installed demo APK in an already booted Android emulator. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
assert(/^emulator-\d+$/.test(serial), 'Este teste só aceita um emulador, não um telefone pessoal.');
const appId = 'br.com.agitta.app';
const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let checks = 0;
const pass = (message) => { ++checks; console.log(`✓ ${message}`); };
let ws;
let nextId = 0;
const pending = new Map();
let createdId;
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Tempo excedido no comando ${method}.`)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}
async function until(expression, message, timeout = 90000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await wait(500);
  }
  throw new Error(message);
}

try {
  assert.equal(adb('shell', 'getprop', 'sys.boot_completed'), '1', 'Aguarde a inicialização completa do emulador.');
  assert(adb('shell', 'pm', 'path', appId).startsWith('package:'), 'Instale o APK de demonstração antes do teste.');
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  const deadline = Date.now() + 120000;
  let pages;
  while (Date.now() < deadline) {
    let pid = '';
    try { pid = adb('shell', 'pidof', appId).split(/\s+/)[0]; }
    catch { /* Android may return before the application process is created. */ }
    if (pid) {
      adb('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
      try { pages = await (await fetch('http://127.0.0.1:9223/json/list', { signal: AbortSignal.timeout(3000) })).json(); } catch { /* WebView may still be starting. */ }
      if (pages?.some((page) => page.url.startsWith('https://localhost/'))) break;
    }
    await wait(1000);
  }
  const page = pages?.find((item) => item.url.startsWith('https://localhost/'));
  assert(page, 'O WebView do aplicativo não ficou disponível.');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', (event) => {
    const response = JSON.parse(event.data);
    const request = pending.get(response.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(response.id);
    if (response.error) request.reject(new Error(response.error.message));
    else request.resolve(response.result);
  });
  await until('!!window.cordova && cordova.require("cordova/channel").onDeviceReady.state === 2', 'Cordova não disparou deviceready.');
  pass('Aplicativo inicia e o Cordova conclui a inicialização nativa');
  assert.equal(await evaluate('fetch("./cordova_plugins.js").then(r => r.ok)'), true);
  pass('Lista de plugins está no APK e responde sem falha de rede');
  await until('!!document.querySelector("#auth-form") || !!document.querySelector(".demo-banner")', 'O app permaneceu na tela de inicialização.');
  if (await evaluate('!!document.querySelector(".demo-banner")')) await evaluate('document.querySelector("[data-action=logout]").click()');
  await until('!!document.querySelector("#auth-form")', 'A tela de login não abriu.');
  assert.equal(await evaluate('!!document.querySelector(".connection-note")'), true, 'Use somente o APK de demonstração neste teste.');
  pass('Tela de login é renderizada no WebView Android');
  await evaluate('document.querySelector("[data-action=demo]").click()');
  await until('document.querySelectorAll(".event-card").length >= 5 && !document.querySelector("#event-list [role=alert]")', 'O feed de demonstração falhou.');
  pass('Demonstração carrega os cinco eventos no WebView');
  await evaluate('document.querySelector(".event-card h3 a").click()');
  await until('!!document.querySelector("dialog[open] .detail-title")', 'Os detalhes não abriram.');
  await evaluate('document.querySelector("dialog [data-action=close]").click()');
  await until('location.hash === "#feed" && !document.querySelector("dialog")', 'O botão de fechar não retornou ao feed.');
  pass('Detalhes abrem e o botão de fechar retorna ao feed');
  await evaluate(`document.querySelector(${JSON.stringify('.mobile-nav a[href="#create"]')}).click()`);
  await until('!!document.querySelector("#event-form")', 'O formulário não abriu.');
  const title = `Teste Android ${Date.now()}`;
  const values = { title, description: 'Evento fictício temporário do teste de execução Android.', starts_at: '2099-12-02T18:00', venue: 'Eixão', region: 'Asa Norte', address: 'SQN 208, Brasília DF', price: '0' };
  await evaluate(`(function(){ var form=document.getElementById('event-form'); var values=${JSON.stringify(values)}; Object.keys(values).forEach(function(key){form.elements.namedItem(key).value=values[key];}); form.querySelector('button[type=submit]').click(); })()`);
  await until(`document.querySelector('.detail-title') && document.querySelector('.detail-title').textContent === ${JSON.stringify(title)}`, 'Não foi possível publicar no WebView.');
  createdId = decodeURIComponent(await evaluate('location.hash.slice(7)'));
  pass('Publicação local funciona no WebView sem APIs JavaScript recentes');
  await evaluate('document.querySelector("dialog [data-save]").click()');
  await until('document.querySelector("dialog [data-save]").getAttribute("aria-pressed") === "true"', 'Não foi possível salvar o evento.');
  await evaluate('document.querySelector("dialog [data-action=close]").click()');
  await until('!document.querySelector("dialog")', 'O botão de fechar não retornou.');
  await evaluate(`document.querySelector(${JSON.stringify('.mobile-nav a[href="#saved"]')}).click()`);
  await until(`Array.from(document.querySelectorAll('.event-card h3')).some(function(el){return el.textContent === ${JSON.stringify(title)};})`, 'O evento salvo não apareceu.');
  pass('Evento publicado aparece nos salvos do aplicativo instalado');
  await evaluate(`document.querySelector(${JSON.stringify('.mobile-nav a[href="#profile"]')}).click()`);
  await until('!!document.querySelector(".profile-card")', 'O perfil não abriu.');
  await evaluate('document.querySelector(".profile-actions [data-action=logout]").click()');
  await until('!!document.querySelector("#auth-form")', 'Não foi possível sair da demonstração.');
  pass('Saída da demonstração retorna ao login');
  if (process.env.AGITTA_ANDROID_SCREENSHOT) writeFileSync(process.env.AGITTA_ANDROID_SCREENSHOT, execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p']));
  console.log(`${checks} verificações passaram no Android. WebView: ${await evaluate('navigator.userAgent')}`);
} finally {
  if (ws?.readyState === WebSocket.OPEN && createdId) {
    await evaluate(`(function(){ var data=JSON.parse(localStorage.getItem('agitta-demo-v1')); if(data){data.events=data.events.filter(function(event){return event.id!==${JSON.stringify(createdId)};}); data.saved=data.saved.filter(function(id){return id!==${JSON.stringify(createdId)};}); localStorage.setItem('agitta-demo-v1',JSON.stringify(data));} })()`);
  }
  ws?.close();
  try { adb('forward', '--remove', 'tcp:9223'); } catch { /* Preserve the original failure. */ }
}
