/*!
Copyright 2023. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/** @type import("postcss-values-parser").ValueParser */
import { parse } from "postcss-values-parser";

/**
 * @typedef Options
 * @property {{ [string]: string }[] | string[]} [fallbackSources] A list of objects or file paths to use as fallback sources
 * @property {boolean} [customPropertiesOnly=false] Whether to only process custom properties
 */
/** @type import('postcss').PluginCreator<Options> */
export default ({
	globalVariables = new Map(),
	allVariables = new Map(),
	allowlist = [],
	denylist = [],
	resolutionDepth = 1,
	customPropertiesOnly = true,
}) => {
	// If the value is static, replace the variable with the value.
	// Otherwise, change the variable name to the mapped name.
	const lookupFallback = (key, depth = 0, fallback = undefined) => {
		console.log(
			"Lookup fallback for",
			key,
			fallback ? "with fallback" + fallback : "",
		);
		console.log("Depth is: ", depth);

		// Check the allowlist
		if (
			allowlist.length > 0 &&
			!allowlist.some((pattern) => pattern.test(key))
		) {
			console.log("Key " + key + " is not in the allowlist");
			return;
		}

		// Check the denylist
		if (denylist.length > 0 && denylist.some((pattern) => pattern.test(key))) {
			console.log("Key " + key + " is in the denylist");
			return;
		}

		if (fallback) {
			console.log("Fallback is already set to: ", fallback);
			return fallback;
		}

		// Check global & then all variables for a fallback value
		if (globalVariables.size > 0 && globalVariables.has(key)) {
			fallback = globalVariables.get(key);
		}

		if (allVariables.size > 0 && allVariables.has(key) && !fallback) {
			fallback = allVariables.get(key);
		}

		// If there's no fallback, we're done
		if (!fallback) return;

		console.log("Fallback is: ", fallback);

		const parsedFallback = parse(fallback);
		let isNestedVar = false;
		parsedFallback.walkFuncs((func) => {
			if (func.isVar) isNestedVar = true;
			return false;
		});

		if (isNestedVar) {
			console.log("Fallback is a nested var");

			// If fallback points to another variable, check if we need to resolve it
			if (depth < resolutionDepth - 1) {
				// Start by parsing the value as a CSS value
			}
		}

		return fallback;
	};

	return {
		postcssPlugin: "postcss-custom-properties-mapping",
		/** @type import('postcss').Processors.Declaration */
		async Declaration(decl, {}) {
			decl.cleanRaws();

			// If we're only resolving fallbacks for custom properties, skip if this isn't one
			if (customPropertiesOnly && !decl.prop.startsWith("--")) return;

			let updatedValue = decl.value?.replace(/[ \t\n\s]+/g, " ")?.trim() ?? "";

			// Parse the value string looking for var() functions,
			// identify the -- prefixed variable key and check if it already
			// has a fallback value by looking for something after a comma
			// even empty spaces after a comma are a valid fallback value
			// values can have multiple var() functions and var() functions can be nested
			function parseVar(value) {
				const key = value.match(/var\(([^,|\)]+)/)?.[1];
				let fallback = value.match(/,(.*?)(?=\))/)?.[1]?.trim();
				if (!fallback) {
					fallback = lookupFallback(key);
				} else if (fallback.includes("var(")) {
					fallback = parseVar(fallback + ")");
				} else {
					console.log("Fallback is: ", fallback);
				}

				console.log({ key, fallback });
				return `var(${key}, ${fallback})`;
			}

			console.log(parseVar(updatedValue));

			// Note this isn't working yet for multiple var() functions in the same value
			decl.assign({ value: parseVar(updatedValue) });
		},
	};
};

export const postcss = true;
