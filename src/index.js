require('geckodriver');
const path = require('path');
const webExt = require('web-ext').default;
const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const FxRunnerUtils = require('fx-runner/lib/utils');
const Fs = require('mz/fs');

const FIREFOX_PREFERENCES = {
  'devtools.chrome.enabled': true,
  'devtools.debugger.remote-enabled': true
};

class WebExtensionsGeckodriver {
  constructor(manifestPath, options = {}) {
    this.options = {
      manifestPath,
      binary: options.binary || 'firefox',
      fxOptions: options.fxOptions,
      webExtAutoInstall: true,
      webExt: Object.assign({
        sourceDir: path.resolve(path.dirname(manifestPath)),
        artifactsDir: path.resolve(path.join(process.cwd(), './.web-ext-artifacts')),
        overwriteDest: true
      }, options.webExt)
    };

    this.geckodriver = false;
  }

  async initialize() {
    await this.buildWebExt();
    await this.setupDriver();
    if (this.options.webExtAutoInstall) {
      await this.installWebExt();
    }
  }

  async buildWebExt() {
    this.webExtBuild = await webExt.cmd.build(this.options.webExt);
  }

  async installWebExt(options) {
    options = Object.assign({
      extensionPath: this.webExtBuild.extensionPath,
      temporary: true
    }, options);

    this.geckodriver.setContext(firefox.Context.CHROME);
    this.webExtensionId = await this.geckodriver.installAddon(options.extensionPath, options.temporary);
  }

  async setupDriver () {
    let { binary, fxOptions } = this.options;
    if (!fxOptions) {
      fxOptions = new firefox.Options();
    }

    Object.keys(FIREFOX_PREFERENCES).forEach(key => {
      fxOptions.setPreference(key, FIREFOX_PREFERENCES[key]);
    });
    fxOptions.setBinary(await this.actualBinary(binary));

    this.geckodriver = new webdriver.Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(fxOptions)
      .build();
  }

  actualBinary(binary) {
    return FxRunnerUtils.normalizeBinary(binary)
      .then(binary => Fs.stat(binary).then(() => binary))
      .catch(ex => {
        if (ex.code === 'ENOENT') {
          throw new Error('Could not find ${binary}');
        }
        throw ex;
      });
  }
}

module.exports = async (manifestPath, options) => {
  const webExtensionGeckodriver = new WebExtensionsGeckodriver(manifestPath, options);
  await webExtensionGeckodriver.initialize();
  return webExtensionGeckodriver;
};

module.exports.webdriver = webdriver;
module.exports.firefox = firefox;