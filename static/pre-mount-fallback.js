(function () {
  // Fallback: remove splash after 3s even if Svelte fails to mount.
  var splash = document.getElementById('splash');
  if (splash) {
    var timeout = setTimeout(function () {
      splash.classList.add('fade-out');
      setTimeout(function () {
        splash.remove();
      }, 500);
    }, 3000);
    // Let SplashScreen component clear this if it mounts first.
    window.__splashTimeout = timeout;
  }

  // Pre-mount fallback: catches errors before hooks.client.ts loads.
  function renderErrorOverlay(text) {
    var d = document.createElement('pre');
    d.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:999999;background:#300;color:#f88;padding:12px;font-size:12px;max-height:40vh;overflow:auto;';
    d.textContent = text;
    document.body.appendChild(d);
  }

  window.addEventListener('error', function (e) {
    renderErrorOverlay('[ERROR] ' + e.message + '\n' + (e.filename || '') + ':' + e.lineno);
  });

  window.addEventListener('unhandledrejection', function (e) {
    renderErrorOverlay(
      '[REJECTION] ' + (e.reason && e.reason.stack ? e.reason.stack : String(e.reason))
    );
  });
})();
