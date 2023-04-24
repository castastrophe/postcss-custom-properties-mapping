/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const valueParser = require('postcss-value-parser');

/**
 * @typedef Options
 * @property {{ [string]: string }} [globalVariables]
 * @property {{ [string]: string }} [allVariables]
 * @property {number} [resolutionDepth=1]
 * @property {boolean} [customPropertiesOnly=false]
 */
/** @type import('postcss').PluginCreator<Options> */
module.exports = (opts) => {
  const {
    globalVariables = {},
    allVariables = {},
    resolutionDepth = 1,
    customPropertiesOnly = false,
  } = opts;
  return {
    postcssPlugin: 'postcss-custom-properties-mapping',
    prepare() {
      /**
       * If the value is static, replace the variable with the value.
       * Otherwise, change the variable name to the mapped name.
       * @param {string} value
       * @param {number} [depth=1]
       * @returns {string}
       */
      function resolveFallback(varString, depth = 1) {
        console.log(varString);
        const value = valueParser(varString);
        if (!value || !value.nodes || value.nodes.length < 1) return varString;

        // Search for a fallback value in the variable declaration
        /** @type {string} */
        let token, fallbackValue;

        console.log(token, { depth });

        value.walk((node, idx) => {
          if (node.type !== 'function' && node.value !== 'var') return;
          if (node.nodes.length < 1) return;

          console.log(token, { idx, depth });
          node.nodes.forEach((segment) => {
            if (segment.type !== 'word' && segment.type !== 'function') return;

            const { type, value } = segment;
            // The first value is the key
            if (type === 'word' && value.startsWith('--')) {
              // Check global & then all variables for a fallback value
              if (globalVariables && typeof globalVariables[value] !== 'undefined') {
                fallbackValue = globalVariables[value];
              } else if (allVariables && typeof allVariables[value] !== 'undefined') {
                fallbackValue = allVariables[value];
              }
            } else if (type === 'function' && value === 'var') {
              const strValue = valueParser.stringify(segment);
              fallbackValue = depth > 0 ? resolveFallback(strValue, depth - 1) : strValue;
            }
          });
        });

        return fallbackValue ? `var(${token}, ${fallbackValue})` : token ? `var(${token})` : varString;
      }

      return {
        /** @type import('postcss').Processors.Declaration */
        async Declaration(decl, {}) {
          if (!/(^|[^\w-])var\([\W\w]+\)/.test(decl.value)) return;

          if (customPropertiesOnly && !decl.prop.startsWith('--')) return;

          decl.value = resolveFallback(decl.value, resolutionDepth);
        }
      };
    }
  };
};

module.exports.postcss = true;
