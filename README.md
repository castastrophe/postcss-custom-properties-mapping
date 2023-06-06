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
