/* Keep this bootstrap compatible with older WebViews, even if the app fails to parse. */
(function () {
  if (typeof window.globalThis === 'undefined') window.globalThis = window;
  function failed(detail) {
    if (!document.getElementById('startup-screen')) return;
    document.getElementById('startup-title').textContent = 'Não foi possível abrir o Agitta.';
    document.getElementById('startup-message').textContent = 'Tente novamente. Se continuar, atualize o Chrome e o Android System WebView na Play Store e reabra o app.';
    document.getElementById('startup-reload').hidden = false;
    if (detail) {
      document.getElementById('startup-error').textContent = String(detail).slice(0, 250);
      document.getElementById('startup-details').hidden = false;
    }
  }
  window.agittaShowStartupError = failed;
  document.getElementById('startup-reload').onclick = function () { window.location.reload(); };
  window.addEventListener('error', function (event) { failed(event.message || 'Falha ao carregar um arquivo do aplicativo.'); }, true);
  window.addEventListener('unhandledrejection', function (event) { failed(event.reason && event.reason.message); });
  window.setTimeout(function () { failed('A inicialização não foi concluída.'); }, 20000);
  // Load the native bridge independently of the application's module graph.
  if (location.protocol === 'file:' || (location.protocol === 'https:' && location.hostname === 'localhost' && !location.port)) {
    window.agittaNativeReady = new Promise(function (resolve, reject) {
      var bridge = document.createElement('script');
      bridge.src = './cordova.js';
      bridge.async = false;
      bridge.onload = function () { document.addEventListener('deviceready', resolve, false); };
      bridge.onerror = function () { reject(new Error('Não foi possível carregar o módulo nativo do aplicativo.')); };
      document.head.appendChild(bridge);
    });
    window.agittaNativeReady.catch(function (error) { failed(error.message); });
  }
}());
