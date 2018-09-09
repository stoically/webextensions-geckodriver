// thanks to @Standard8
//
// Mozilla Public License Version 2.0
// https://github.com/Standard8/example-webextension
// https://github.com/Standard8/example-webextension/blob/master/test/functional/utils.js

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require('geckodriver');

const firefox = require('selenium-webdriver/firefox');
const webdriver = require('selenium-webdriver');
const FxRunnerUtils = require('fx-runner/lib/utils');
const Fs = require('mz/fs');

// Note: Geckodriver already has quite a good set of default preferences
// for disabling various items.
// https://github.com/mozilla/geckodriver/blob/master/src/marionette.rs
const FIREFOX_PREFERENCES = {
  // Ensure e10s is turned on.
  'browser.tabs.remote.autostart': true,
  'browser.tabs.remote.autostart.1': true,
  'browser.tabs.remote.autostart.2': true,
  // These are good to have set up if you're debugging tests with the browser
  // toolbox.
  'devtools.chrome.enabled': true,
  'devtools.debugger.remote-enabled': true
};

function promiseActualBinary(binary) {
  return FxRunnerUtils.normalizeBinary(binary)
    .then(binary => Fs.stat(binary).then(() => binary))
    .catch(ex => {
      if (ex.code === 'ENOENT') {
        throw new Error('Could not find ${binary}');
      }
      throw ex;
    });
}

async function promiseInstallAddon(driver, xpi) {
  // This manually installs the add-on as a temporary add-on.
  // Hopefully selenium/geckodriver will get a way to do this soon:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1298025
  return driver.executeAsyncScript(
    `
    let fileUtils = Components.utils.import('resource://gre/modules/FileUtils.jsm');
    let FileUtils = fileUtils.FileUtils;
    let callback = arguments[arguments.length - 1];
    Components.utils.import('resource://gre/modules/AddonManager.jsm');

    let listener = {
      onInstallEnded: function(install, addon) {
        callback([addon.id, 0]);
      },

      onInstallFailed: function(install) {
        callback([null, install.error]);
      },

      onInstalled: function(addon) {
        AddonManager.removeAddonListener(listener);
        callback([addon.id, 0]);
      }
    };

    let file = new FileUtils.File(arguments[0]);

    AddonManager.addAddonListener(listener);
    AddonManager.installTemporaryAddon(file).catch(error => {
      Components.utils.reportError(error); callback([null, error])
    });`,
    xpi)
    .then(result => {
      if (!result[0] && result[1]) {
        return driver.quit().then(() => {
          // eslint-disable-next-line no-console
          console.error(result);
          throw new Error('Failed to install add-on');
        });
      }

      return driver;
    });
}

module.exports.promiseSetupDriver = (xpi, binary) => {
  const options = new firefox.Options();
  Object.keys(FIREFOX_PREFERENCES).forEach(key => {
    options.setPreference(key, FIREFOX_PREFERENCES[key]);
  });
  options.setBinary(await promiseActualBinary(binary))

  const driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

  driver.setContext(firefox.Context.CHROME);
  return promiseInstallAddon(driver, xpi);
};
