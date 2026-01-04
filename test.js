import { readFile } from "node:fs/promises";
import test from "ava";
import postcss from "postcss";

import plugin from "./index.js";

/**
 * Compare the fixture with the expected output
 * @param {import("ava").TestFunction} t
 * @param {string} fixtureFilePath
 * @param {string} expectedFilePath
 * @param {import("./index.js").Options} options
 * @returns {Promise<void>}
 */
async function compare(t, fixtureFilePath, expectedFilePath, options = {}) {
	const fixture = await readFile(`./fixtures/${fixtureFilePath}`, {
		encoding: "utf8",
	});
	const expected = await readFile(`./expected/${expectedFilePath}`, {
		encoding: "utf8",
	});

	// Process the fixture with the plugin
	return postcss([plugin(options)])
		.process(fixture, { from: fixtureFilePath })
		.then((result) => {
			// Compare the result with the expected output
			t.is(result.css, expected);

			// Ensure no warnings were thrown
			t.is(result.warnings().length, 0);
		})
		.catch((error) => {
			t.fail(error.message);
		});
}

const globalData = new Map([
	["--color", "red"],
	["--padding-block", "10px"],
	["--padding-block", "5px"],
	["--border-width", "1px"],
	["--border-color", "green"],
]);

const allData = new Map([...globalData, ["--local-color", "var(--color)"]]);

test("create basic output", async (t) => {
	return compare(t, "basic.css", "basic.css", {
		globalVariables: globalData,
		allVariables: allData,
		denylist: [/^--mod-/],
		resolutionDepth: 3,
	});
});
