const path = require('path');
const geckodriver = require('./geckodriver');
const webExt = require('web-ext').default;
const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

class WebExtensionsGeckodriver {
  constructor(manifestPath, options = {}) {
    this.options = {
      manifestPath,
      binary: options.binary || 'firefox',
      fxOptions: options.fxOptions,
      webExt: Object.assign({
        sourceDir: path.resolve(path.dirname(manifestPath)),
        artifactsDir: path.resolve(path.join(process.cwd(), './.web-ext-artifacts')),
        overwriteDest: true
      }, options.webExt)
    };

    this.geckodriver = false;
  }

  async initialize() {
    const webExtBuild = await this.buildWebExt();
    this.geckodriver =
      await geckodriver.promiseSetupDriver(webExtBuild.extensionPath, this.options);
    this.geckodriver.setContext(firefox.Context.CHROME);
  }

  buildWebExt() {
    return webExt.cmd.build(this.options.webExt);
  }
}

module.exports = async (manifestPath, options) => {
  const webExtensionGeckodriver = new WebExtensionsGeckodriver(manifestPath, options);
  await webExtensionGeckodriver.initialize();
  return webExtensionGeckodriver;
};

module.exports.webdriver = webdriver;
module.exports.firefox = firefox;
