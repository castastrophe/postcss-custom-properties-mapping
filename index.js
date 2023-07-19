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

const fs = require("fs");
const postcss = require("postcss");

/** @type import("postcss-values-parser").ValueParser */
const { parse } = require("postcss-values-parser");

/**
 * @typedef Options
 * @property {{ [string]: string }[] | string[]} [fallbackSources] A list of objects or file paths to use as fallback sources
 * @property {boolean} [customPropertiesOnly=false] Whether to only process custom properties
 */
/** @type import('postcss').PluginCreator<Options> */
module.exports = ({
	fallbackSources = [],
	customPropertiesOnly = false,
	resolutionDepth = 1,
} = {}) => {
	return {
		postcssPlugin: "postcss-custom-properties-mapping",
		prepare(result) {
			// A cache of recently found values for faster lookups
			const rootCache = new Map();
			const ruleCache = new Map();
			const sourcesCache = new Map();

			// Read in the fallback sources into a shared map
			fallbackSources = Array.isArray(fallbackSources)
				? fallbackSources
				: [fallbackSources];
			fallbackSources.forEach((source) => {
				if (typeof source === "string") {
					// If the source is a string, assume it's a file path
					// and try to load it
					const reference = fs.readFileSync(source, "utf8");
					if (!reference) {
						result.warn(result, `Unable to load fallback source ${source}`, {});
						return;
					}

					postcss.parse(reference).walkDecls((decl) => {
						sourcesCache.set(decl.prop, decl.value);
					});
				} else if (typeof source === "object") {
					Object.keys(source).forEach((key) => {
						if (!key.startsWith("--")) return;
						sourcesCache.set(key, source[key]);
					});
				}
			});

			function getFallback(lookup) {
				// Check the caches first to see if we've already found this value
				if (ruleCache.has(lookup)) {
					// If we find it in the ruleCache, this definition exists in the same rule
					// and doesn't need to use a fallback
					return;
				}

				// If we find it in the rootCache, this definition exists in the root
				// and we don't have to check the fallback sources
				if (
					rootCache.has(lookup) &&
					typeof rootCache.get(lookup) !== "undefined"
				) {
					return rootCache.get(lookup);
				}

				// If we haven't found this value yet, check the fallback sources
				if (
					sourcesCache.has(lookup) &&
					typeof sourcesCache.get(lookup) !== "undefined"
				) {
					return sourcesCache.get(lookup);
				}

				// If we've made it this far, we haven't found a fallback value
				decl.warn(result, `No fallback value found for ${lookup}`, {
					node: decl,
				});
			}

			return {
				RuleExit() {
					// Clear the cache after each rule
					ruleCache.clear();
				},
				/** @type import('postcss').Processors.Declaration */
				Declaration(decl, { result }) {
					// Check if this declaration is a custom property
					const isProp = decl.prop.startsWith("--");
					const isRoot =
						decl.parent.selector === ":root" ||
						decl.parent.selector === ":host";

					// Add this declaration to the cache if it's a custom property
					// in case a descendant declaration needs it
					if (isProp) {
						if (isRoot) rootCache.set(decl.prop, decl.value);
						else ruleCache.set(decl.prop, decl.value);
					}

					// If this neither is a custom property nor uses a custom property, stop processing
					if (customPropertiesOnly && !isProp) return;

					/** @type import('postcss-value-parser').ValueParser */
					const newValue = [];
					// Walk the declaration value and look for var() functions
					parse(decl.value).walkFuncs((node) => {
						// We don't care if it's not a var function
						if (!node.isVar) return;

						// Filter out comments and punctuation
						const filtered = node.nodes.filter(
							(n) => n.type !== "comment" && n.type !== "punctuation"
						);

						// If there are more than 1 items left, a fallback is already defined
						if (filtered.length > 1) return;

						// Capture the first value as our lookup value
						const lookup = filtered[0].value;

						// If the first value isn't a word or doesn't start with --, it's not a custom property
						if (filtered[0].type !== "word" || !lookup.startsWith("--")) {
							decl.warn(
								result,
								`The first value in the var function is not a custom property.`,
								{
									node: decl,
								}
							);
							return;
						}

						// Go fetch the fallback value
						const fallbackValue = getFallback(lookup);
						if (!fallbackValue) return;

						console.log(`Found fallback value for ${lookup}: ${fallbackValue}`);
						newValue.push(`var(${lookup}, ${fallbackValue})`);
					});

					// Update the declaration value
					if (newValue.length) decl.assign({ value: newValue.join(" ") });
				},
			};
		},
	};
};

module.exports.postcss = true;
