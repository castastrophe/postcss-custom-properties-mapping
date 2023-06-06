const fs = require("fs");
const test = require("ava");
const postcss = require("postcss");
const plugin = require("./index.js");

function compare(t, fixtureFilePath, expectedFilePath, options = {}) {
	return postcss([plugin(options)])
		.process(readFile(`./fixtures/${fixtureFilePath}`), {
			from: fixtureFilePath,
		})
		.then((result) => {
			const actual = result.css;
			const expected = readFile(`./expected/${expectedFilePath}`);
			t.is(actual, expected);
			t.is(result.warnings().length, 0);
		});
}

function readFile(filename) {
	return fs.readFileSync(filename, "utf8");
}

const globalData = new Map([
	["--color", "red"],
	["--padding-block", "10px"],
	["--padding-block", "5px"],
	["--border-width", "1px"],
	["--border-color", "green"],
]);

const allData = new Map([...globalData, ["--local-color", "var(--color)"]]);

test("create basic output", (t) => {
	return compare(t, "basic.css", "basic.css", {
		globalVariables: globalData,
		allVariables: allData,
		denylist: [/^--mod-/],
		resolutionDepth: 3,
	});
});
