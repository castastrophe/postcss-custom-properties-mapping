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

/** @type import("postcss-value-parser").ValueParser */
const valueParser = require("postcss-value-parser");

/**
 * @typedef Options
 * @property {{ [string]: string }} [globalVariables]
 * @property {{ [string]: string }} [allVariables]
 * @property {boolean} [customPropertiesOnly=false]
 */
/** @type import('postcss').PluginCreator<Options> */
module.exports = ({
	globalVariables = {},
	allVariables = {},
	customPropertiesOnly = false,
} = {}) => {
	// A cache of recently found values for faster lookups
	const valuesCache = new Map();

	return {
		postcssPlugin: "postcss-custom-properties-mapping",
		/** @type import('postcss').Processors.Declaration */
		Declaration(decl, { result }) {
			// Check if this declaration is a custom property
			const isProp = decl.prop.startsWith("--");
			// Check if this declaration uses a custom property
			const usesProp = decl.value.match(/var\(.*?\)/g);

			// Add this declaration to the cache if it's a custom property
			// in case a descendant declaration needs it
			if (isProp) valuesCache.set(decl.prop, decl.value);

			// If this neither is a custom property nor uses a custom property, stop processing
			if ((customPropertiesOnly && !isProp) || !usesProp) return;

			/**
			 *
			 * @param {import("postcss-value-parser").Node} valueNode
			 * @param {number} idx
			 * @returns
			 */
			function parseValueForProperties({ type, value, nodes }, idx = 0) {
				// We're only interested here in var functions
				if (type === "function" && value === "var") {
					// Why would a var not have nodes? 🤷‍♀️
					if (!nodes || nodes.length === 0) {
						decl.warn(result, `No nodes found in var function: ${value}`, {
							node: decl,
						});
						return;
					}

					// Filter out any non-word types and reverse them so we're starting with the last
					const onlyWords = nodes
						.reverse()
						.filter((n) => n.type === "word" || n.type === "function");

					// Why would a var function not have a word? 🤷‍♀️
					// @todo needs test added
					if (onlyWords.length === 0) {
						decl.warn(result, `No words found in var function: ${value}`, {
							node: decl,
						});
						return;
					}

					// Recursively call this function to parse the next var function if necessary
					return parseValueForProperties(onlyWords?.[0], idx);
				}

				// If the value is not a word, we're not interested anymore
				// i.e., commas, etc.
				if (type !== "word" && type !== "function") return;

				// Check the cache first to see if we've already found this value
				if (valuesCache.has(value)) {
					return valuesCache.get(value);
				}

				// Check global & then all variables for a fallback value
				if (globalVariables && typeof globalVariables[value] !== "undefined") {
					valuesCache.set(value, globalVariables[value]);
					return globalVariables[value];
				}

				if (allVariables && typeof allVariables[value] !== "undefined") {
					valuesCache.set(value, allVariables[value]);
					return allVariables[value];
				}

				// If we've made it this far, we haven't found a fallback value
				decl.warn(result, `No fallback value found for ${value}`, {
					node: decl,
				});

				return;
			}

			console.log("\t-------");
			console.log(decl.prop, decl.value);

			// Leverage value parser to walk the declaration value
			/** @type import('postcss-value-parser').ValueParser */
			valueParser(decl.value).walk((node, idx) => {
				if (node.value === " ") return;
				console.log({ value: node.value, idx });
				const fallbackValue = parseValueForProperties(node, idx);

				if (!fallbackValue) return;

				if (node.nodes && node.nodes.length > 0) {
					console.log({ nodes: node.nodes });
					node.nodes.push(
						{ type: "div", value: ",", after: " " },
						{ type: "word", value: fallbackValue }
					);
					// Update the declaration value
					console.log("Update: ", valueParser.stringify(node));
					decl.assign({ value: valueParser.stringify(node) });

					console.log("exit\n\n");
					// Stop walking the tree if we've updated the value already
					return false;
				} else {
					console.log("No nodes?", { node });
				}

				return;
			});
		},
	};
};

module.exports.postcss = true;
