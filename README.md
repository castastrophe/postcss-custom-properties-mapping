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

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Apache 2.0 © [Cassondra Roberts](https://allons-y.llc)
