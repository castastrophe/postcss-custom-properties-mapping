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
const { parse, nodeToString } = require("postcss-values-parser");

/**
 * @typedef Options
 * @property {{ [string]: string }[] | string[]} [fallbackSources] A list of objects or file paths to use as fallback sources
 * @property {boolean} [customPropertiesOnly=false] Whether to only process custom properties
 */
/** @type import('postcss').PluginCreator<Options> */
module.exports = ({
	globalVariables = new Map(),
	allVariables = new Map(),
	allowlist = [],
	denylist = [],
	resolutionDepth = 1,
	customPropertiesOnly = true,
}) => {
	return {
		postcssPlugin: "postcss-custom-properties-mapping",
		/** @type import('postcss').Processors.Declaration */
		async Declaration(decl, {}) {
			if (!/(^|[^\w-])var\([\W\w]+\)/.test(decl.value)) return;

			// If we're only resolving fallbacks for custom properties, skip if this isn't one
			if (customPropertiesOnly && !decl.prop.startsWith("--")) return;

			// If the value is static, replace the variable with the value.
			// Otherwise, change the variable name to the mapped name.
			const resolveFallback = (valueStr, depth = 0) => {
				if (!valueStr) return false;

				const value = parse(valueStr);
				if (!value || !value.nodes || value.nodes.length < 1) return false;

				// Search for a fallback value in the variable declaration
				// Bubble set to true so it will traverse from inside -> out
				value.walk((node, idx) => {
					if (!node && node.type !== "word" && node.type !== "function") return;

					if (node.type === "function" && node.value === "var") {
						if (depth >= resolutionDepth) return;

						[...node.nodes].reverse().forEach((segment) => {
							// If this is not a word or function, we're not interested
							if (segment.type !== "word" && segment.type !== "function")
								return;

							// If this is a function, recurse
							if (segment.type === "function") {
								return resolveFallback(nodeToString(segment), ++depth);
							}
						});
					}

					if (node.type !== "word") return;

					// Check the allowlist
					if (
						allowlist.length > 0 &&
						!allowlist.some((pattern) => pattern.test(node.value))
					)
						return;

					// Check the denylist
					if (
						denylist.length > 0 &&
						denylist.some((pattern) => pattern.test(node.value))
					)
						return;

					let fallback;

					// Check global & then all variables for a fallback value
					if (globalVariables.size > 0 && globalVariables.has(node.value)) {
						fallback = globalVariables.get(node.value);
					}

					if (allVariables.size > 0 && allVariables.has(node.value)) {
						fallback = allVariables.get(node.value);
					}

					// If there's no fallback, we're done
					if (!fallback) return;

					const newItems = [
						{
							type: "div",
							after: " ",
							sourceIndex: node.sourceIndex,
							value: ",",
						},
						{
							type: "word",
							sourceIndex: node.sourceIndex,
							value: fallback,
						},
					];

					if (!node.nodes || node.nodes.length === 0) {
						const parent = value.nodes[idx];
						if (!parent || !parent.nodes || parent.nodes === 0) return;

						const strValue = nodeToString(node) + ", " + fallback;
						// update the node value with the fallback string
						node.value = parse(strValue);
					} else node.nodes.push(...newItems);
				});

				return value ? nodeToString(value) : false;
			};

			// Kick off the recursive resolution
			const getValue = resolveFallback(decl.value);

			// @todo does this need to be removed? maybe it's an empty hook?
			if (typeof getValue === "undefined" || getValue === false) return;

			decl.assign({ value: getValue });
		},
	};
};

module.exports.postcss = true;
