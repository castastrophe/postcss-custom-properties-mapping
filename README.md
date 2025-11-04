# postcss-custom-properties-mapping

>

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
require("postcss-custom-properties-mapping")({});
```

## Options

### `globalVariables`

Type: `object`

An object of available global variables; key is the variable name, value is the variable value.

### `allVariables`

Type: `object`

An object of all available variables in the system (allows for a wider search); key is the variable name, value is the variable value.

### `customPropertiesOnly`

Type: `boolean`<br>
Default: `false`

If set to `true`, only custom properties mapped to variable functions will be resolved. If set to `false`, all variable functions will be resolved, whether assigned to a CSS property or a custom property.

## Usage

```css
.element {
	--element-color: var(--color);
	color: var(--element-color);
}

.element--modifier {
	--element-color: var(--local-color);
}
```

Result:

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
