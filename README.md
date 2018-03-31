### WebExtensions GeckoDriver

When testing [WebExtensions](https://developer.mozilla.org/Add-ons/WebExtensions) you might want to automatically load them into a browser and do functional testing with [geckodriver](https://github.com/mozilla/geckodriver).

### Installation

```
npm install --save-dev webextensions-geckodriver
```

### Usage

```js
const webExtensionsGeckodriver = require('webextensions-geckodriver');
const webExtension = await webExtensionsGeckodriver('/absolute/path/to/manifest.json');
```

Loads the Add-on into a `firefox` instance. The returned Promise resolves an `<object>` with the following properties:

* *geckodriver*, `<object>`, the geckodriver instance



### API

#### Exported default function(path[, options])

* *path* `<string>`, required, absolute path to the `manifest.json` file
* *options* `<object>`, optional
  * *binary* `<string>`, optional, lets you set the binary that should be used when spawning the browser. defaults to `firefox`.
  * *webExt* `<object>`, optional, lets you overwrite the parameters that get passed into [`webExt.cmd.build`](https://github.com/mozilla/web-ext#using-web-ext-in-nodejs-code)


Returns a Promise that resolves an `<object>` with the following properties in case of success:

* *geckodriver*, `<object>`, new geckodriver instance


### Credits

Thanks to [Standard8](https://github.com/Standard8) for the original work in [example-webextension](https://github.com/Standard8/example-webextension).