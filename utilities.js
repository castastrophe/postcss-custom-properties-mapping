/**
 * Parse a fallback JSON object and return a key-value pair
 * @param {string} key - The key to parse
 * @param {string | object} value - The value to parse
 * @returns {{ key: string, value: string } | null} A key-value pair
 */
export function parseFallbackJSON(key, value) {
	// If the key is not a string, or the value is not a string or object, return null
	if (
		!key ||
		typeof key !== "string" ||
		(typeof value !== "string" && typeof value !== "object" && value !== null)
	) {
		return null;
	}

	// Trim the key
	key = key.trim();

	// If the key doesn't start with --, add it
	if (!key.startsWith("--")) {
		// Add the dash prefix to the key
		key = `--${key}`;
	}

	// If the value is an object, use the value property
	if (typeof value === "object") {
		value = value?.value;
	}

	// If the value is undefined, return null
	if (
		typeof value === "undefined" ||
		value === null ||
		typeof value !== "string" ||
		value.trim() === ""
	) {
		return null;
	}

	// Return the key-value pair
	return { key, value: value.trim() };
}
