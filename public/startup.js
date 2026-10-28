/* Show recovery even if an older browser cannot parse the application. */
(function () {
  if (typeof window.globalThis === 'undefined') window.globalThis = window;
  // Keep browser chrome in sync without reloading the page or touching forms.
  if (typeof window.matchMedia === 'function') {
    var lightTheme = window.matchMedia('(prefers-color-scheme: light)');
    function syncThemeColor() {
      document.querySelector('meta[name="theme-color"]').setAttribute('content', lightTheme.matches ? '#f8f7f3' : '#0b0d0b');
    }
    syncThemeColor();
    if (lightTheme.addEventListener) lightTheme.addEventListener('change', syncThemeColor);
    else if (lightTheme.addListener) lightTheme.addListener(syncThemeColor);
  }
  function failed(detail) {
    if (!document.getElementById('startup-screen')) return;
    document.getElementById('startup-title').textContent = 'Não foi possível abrir o Agitta.';
    document.getElementById('startup-message').textContent = 'Tente novamente com conexão à internet. Se continuar, atualize seu navegador e reabra o Agitta.';
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
}());
