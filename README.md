### WebExtensions GeckoDriver

When testing [WebExtensions](https://developer.mozilla.org/Add-ons/WebExtensions) you might want to automatically load them into Firefox and do functional testing with [geckodriver](https://github.com/mozilla/geckodriver).

### Installation

```
npm install --save-dev webextensions-geckodriver
```

### Usage

```js
const webExtensionsGeckoDriver = require('webextensions-geckodriver');
const webExtension = await webExtensionsGeckoDriver('/absolute/path/to/manifest.json');
```

Loads the WebExtension as Temporary Add-on into a `firefox` instance. The returned Promise resolves an `<object>` with a `geckodriver` instance as property. See [API docs](#api) for more details.


### Example

manifest.json includes
```
  "browser_action": {
    "default_title": "Visit Mozilla"
  },
  "applications": {
    "gecko": {
      "id": "@examplewebextension",
      "strict_min_version": "57.0"
    }
  }
```

Test could look like this (using `mocha`):
```js
const path = require('path');
const assert = require('assert');

const webExtensionsGeckoDriver = require('webextensions-geckodriver');
const webdriver = webExtensionsGeckoDriver.webdriver;

const manifestPath = path.resolve(path.join(__dirname, './path/to/manifest.json'));

describe('Example', () => {
  let geckodriver;

  before(async () => {
    const webExtension = await webExtensionsGeckoDriver(manifestPath);
    geckodriver = webExtension.geckodriver;
  });

  it('should have a Toolbar Button', async () => {
    const button = await geckodriver.wait(webdriver.until.elementLocated(
      webdriver.By.id('_examplewebextension-browser-action') // special chars in the id are replaced with _
    ), 1000);
    assert.equal(await button.getAttribute('tooltiptext'), 'Visit Mozilla');
  });

  after(() => {
    return geckodriver.quit();
  });
});
```

Full executable example is in the [example directory](example/).


### API

#### Exported default function(path[, options])

* *path* `<string>`, required, absolute path to the `manifest.json` file
* *options* `<object>`, optional
  * *binary* `<string>`, optional, lets you set the `binary` that is passed to [`fx-runner`](https://github.com/mozilla-jetpack/node-fx-runner). Possible values: `firefox`, `beta`, `aurora`, `nightly`, `firefoxdeveloperedition`. Defaults to: `firefox`.
  * *webExt* `<object>`, optional, lets you overwrite the parameters that get passed into [`webExt.cmd.build`](https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code)


Returns a Promise that resolves an `<object>` with the following properties in case of success:

* *geckodriver*, `<object>`, a new [geckodriver](https://github.com/mozilla/geckodriver) instance


#### Exported property: `webdriver`

Return value of [`require('selenium-webdriver')`](https://www.npmjs.com/package/selenium-webdriver)

#### Exported property: `firefox`

Return value of [`require('selenium-webdriver/firefox')`](https://www.npmjs.com/package/selenium-webdriver)

### JSDOM

If you're looking for a way to test WebExtensions with JSDOM then [`webextensions-jsdom`](https://github.com/webexts/webextensions-jsdom) might be for you.

### Credits

Thanks to [Standard8](https://github.com/Standard8) for the original work in [example-webextension](https://github.com/Standard8/example-webextension).