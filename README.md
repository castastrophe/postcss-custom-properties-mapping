# postcss-custom-properties-mapping

> This plugin allows pre-compilation manipulation of custom properties to dynamically connect them to a dataset.

## Installation

```sh
yarn add -D postcss-custom-properties-mapping
```

Via the command line:

```sh
postcss -u postcss-custom-properties-mapping -o dist/index.css src/index.css
```

In the postcss config:

```js
require("postcss-custom-properties-mapping")({
  globalVariables = {},
  allVariables = {},
  resolutionDepth = 1,
  customPropertiesOnly = false,
})
```

## Options

### `globalVariables`

Type: `Object`<br>
Default: `{}`

An optional object of global variables that will be used in the resolution process.

### `allVariables`

Type: `Object`<br>
Default: `{}`

An optional object of all variables that will be used in the resolution process.

### `resolutionDepth`

Type: `Number`<br>
Default: `1`

The maximum depth of the resolution process; how many iterations will be performed before returning the result.

### `customPropertiesOnly`

Type: `Boolean`<br>
Default: `false`

If `true`, only custom properties will be returned as fallback values. If `false`, all types of fallback values will be allowed.

## Usage

Assuming you have some variables defined and rule(s) that use them:

```css
.element {
	--element-color: var(--color);
	color: var(--element-color);
}

.element--modifier {
	--element-color: var(--local-color);
}
```

And the following set of inputs:

```js
globalVariables: {
    '--color': 'red',
},
allVariables: {
  '--color': 'red',
  '--local-color': 'var(--color)',
},
resolutionDepth: 3,
```

The available fallback values will be resolved:

```css
.element {
	--element-color: var(--color, red);
	color: var(--element-color);
}

.element--modifier {
	--element-color: var(--local-color, var(--color, red));
}
```

## Contributing

Contributions are welcome! Please open an [issue](https://github.com/castastrophe/postcss-custom-properties-mapping/issues/new) or submit a pull request.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details. This means you can use this however you like as long as you provide attribution back to this one. It's nice to share but it's also nice to get credit for your work. 😉

## Funding ☕️

If you find this plugin useful and would like to buy me a coffee/beer as a small thank you, I would greatly appreciate it! Funding links are available in the GitHub UI for this repo.

<a href="https://www.buymeacoffee.com/castastrophe" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
