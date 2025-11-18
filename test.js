import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import test from "ava";
import postcss from "postcss";
import plugin, { warnings } from "./index.js";

async function compare(t, fixtureFilePath, expectedFilePath, options = {}) {
	const fixture = readFile(`./fixtures/${fixtureFilePath}`, {
		encoding: "utf8",
	});
	return postcss([plugin(options)])
		.process(await fixture, { from: fixtureFilePath })
		.then(async (result) => {
			const actual = result?.css;
			const expected = existsSync(`./expected/${expectedFilePath}`)
				? await readFile(`./expected/${expectedFilePath}`, { encoding: "utf8" })
				: undefined;
			return {
				t,
				actual,
				expected,
				result,
			};
		});
}

test("create basic fallbacks", async (t) => {
	return compare(t, "basic.css", "basic.css", {}).then(
		({ t, actual, expected, result }) => {
			t.is(actual, expected);
			t.is(result.warnings().length, 0);
		},
	);
});

test("fallback source as an object", async (t) => {
	return compare(t, "basic.css", "with-fallback-data.css", {
		fallbackSources: [
			{
				"--color": "red",
				"--local-color": "var(--color)",
			},
		],
	}).then(({ t, actual, expected, result }) => {
		t.is(actual, expected);
		t.is(result.warnings().length, 0);
	});
});

test("fallback source as a file path", async (t) => {
	return compare(t, "basic.css", "with-fallback-data.css", {
		fallbackSources: ["./fixtures/fallback-data.json"],
	}).then(({ t, actual, expected, result }) => {
		t.is(actual, expected);
		t.is(result.warnings().length, 0);
	});
});

test("fallback source with invalid file path", async (t) => {
	const sources = ["./fixtures/invalid-file-path.json"];
	return compare(t, "basic.css", undefined, {
		fallbackSources: sources,
	}).then(({ t, result }) => {
		t.is(result.warnings().length, sources.length);

		result.warnings().forEach((warning, idx) => {
			t.is(warning.text, warnings.fileNotExist(sources[idx]));
		});
	});
});
