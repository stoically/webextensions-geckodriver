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
    this.options = Object.assign({
      manifestPath,
      binary: 'firefox',
      autoInstall: true
    }, options, {
      webExt: Object.assign({
        sourceDir: path.resolve(path.dirname(manifestPath)),
        artifactsDir: path.resolve(path.join(process.cwd(), './.web-ext-artifacts')),
        overwriteDest: true
      }, options.webExt)
    });

    this.geckodriver = false;
  }

  async initialize() {
    await this.build();
    await this.setupDriver();
    if (this.options.autoInstall) {
      await this.install();
    }
  }

  async build() {
    this.webExtBuild = await webExt.cmd.build(this.options.webExt);
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

  async install(options) {
    options = Object.assign({
      extensionPath: this.webExtBuild.extensionPath,
      temporary: true
    }, options);

    this.geckodriver.setContext(firefox.Context.CHROME);
    this.webExtensionId = await this.geckodriver.installAddon(options.extensionPath, options.temporary);
  }

  uninstall(webExtensionId) {
    if (!webExtensionId) {
      webExtensionId = this.webExtensionId;
    }

    return this.geckodriver.uninstallAddon(webExtensionId);
  }

  // https://bugzilla.mozilla.org/show_bug.cgi?id=1534005#c2
  // Available policy targets:
  // string debugName
  // number instanceId
  // object optionalPermissions
  // object extension
  // function canAccessWindow
  // function canAccessURI
  // function hasPermission
  // function isPathWebAccessible
  // function localize
  // function getURL
  // function registerContentScript
  // function unregisterContentScript
  // function injectContentScripts
  // string id
  // string mozExtensionHostname
  // string baseURL
  // string name
  // string contentSecurityPolicy
  // object permissions
  // object allowedOrigins
  // object contentScripts
  // boolean active
  // boolean privateBrowsingAllowed
  // object readyPromise
  policy(options) {
    if (!options.target) {
      throw new Error('policy needs a target');
    }
    const target = options.target;
    const targetParameters = options.targetParameters || [];
    const webExtensionId = options.webExtensionId || this.webExtensionId;

    return this.geckodriver.executeScript(`
      const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
      const {WebExtensionPolicy} = Components.utils.getGlobalForObject(Services);
      const webExtension = WebExtensionPolicy.getByID("${webExtensionId}");
      if (typeof webExtension["${target}"] === "function") {
        return webExtension["${target}"].apply(this, arguments[0]);
      } else {
        return webExtension["${target}"];
      }
    `, targetParameters);
  }

  internalUUID() {
    return this.policy({target: 'mozExtensionHostname'});
  }
}

module.exports = async (manifestPath, options) => {
  const webExtensionGeckodriver = new WebExtensionsGeckodriver(manifestPath, options);
  await webExtensionGeckodriver.initialize();
  return webExtensionGeckodriver;
};

module.exports.webdriver = webdriver;
module.exports.firefox = firefox;