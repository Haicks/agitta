export function setupWebApp() {
  const toolbar = document.querySelector('#webapp-toolbar');
  const offline = document.querySelector('#offline-status');
  const install = document.querySelector('#pwa-install');
  const update = document.querySelector('#pwa-update');
  const guide = document.querySelector('#install-guide');
  const standalone = window.matchMedia('(display-mode: standalone)');
  let installPrompt;
  let registration;
  let applyingUpdate = false;
  let installed = false;

  function refresh() {
    offline.hidden = navigator.onLine;
    install.hidden = installed || !window.isSecureContext || standalone.matches || navigator.standalone === true;
    toolbar.hidden = offline.hidden && install.hidden && update.hidden;
  }
  window.addEventListener('online', refresh);
  window.addEventListener('offline', refresh);
  if (standalone.addEventListener) standalone.addEventListener('change', refresh);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', () => { installPrompt = null; installed = true; refresh(); });
  install.addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try { await prompt.prompt(); await prompt.userChoice; return; }
      catch { /* Fall back to browser instructions if the prompt is unavailable. */ }
    }
    document.querySelector('#install-instructions').textContent = /iPad|iPhone|iPod/.test(navigator.userAgent)
      ? 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Se aparecer, ative Abrir como App.'
      : 'Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial. No computador, procure o ícone de instalação na barra de endereço.';
    guide.showModal();
  });
  document.querySelector('#install-close').addEventListener('click', () => guide.close());
  guide.addEventListener('click', (event) => { if (event.target === guide) guide.close(); });
  refresh();

  // Only production registers a worker: development must always serve fresh source.
  if (!import.meta.env.PROD || !window.isSecureContext || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applyingUpdate) window.location.reload();
  });
  update.addEventListener('click', () => {
    if (!registration?.waiting) return;
    applyingUpdate = true;
    update.disabled = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
  function offerUpdate() {
    if (registration.waiting && navigator.serviceWorker.controller) {
      update.hidden = false;
      refresh();
    }
  }
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
    updateViaCache: 'none',
  }).then((result) => {
    registration = result;
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
    });
    // Check on return without reloading or replacing an open form.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) registration.update().catch(() => {});
    });
  }).catch(() => { /* Browser access still works when installation is unavailable. */ });
}
