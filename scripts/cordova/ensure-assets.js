const fs = require('node:fs');
const path = require('node:path');

module.exports = function ensureCordovaAssets(context) {
  if (!context.opts.platforms.includes('android')) return;
  const root = context.opts.projectRoot;
  const targets = [
    'platforms/android/platform_www/cordova_plugins.js',
    'platforms/android/app/src/main/assets/www/cordova_plugins.js',
  ];
  const config = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const relative of targets) {
    const target = path.join(root, relative);
    if (fs.existsSync(target)) continue;
    if (Object.keys(config.cordova?.plugins || {}).length) {
      throw new Error('O Cordova não gerou a lista de plugins. Execute cordova prepare antes de compilar.');
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'cordova.define("cordova/plugin_list", function(require, exports, module) { module.exports = []; module.exports.metadata = {}; });\n');
  }
};
