function createLogger({ verbose } = {}) {
	const isVerbose = Boolean(verbose);

	return {
		info(message) {
			console.log(message);
		},
		warn(message) {
			console.warn(message);
		},
		error(message) {
			console.error(message);
		},
		debug(message) {
			if (isVerbose) {
				console.log(message);
			}
		},
	};
}

module.exports = { createLogger };
