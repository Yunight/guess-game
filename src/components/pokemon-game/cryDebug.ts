export const CRY_DEBUG_ENABLED = import.meta.env.DEV;

const CRY_DEBUG_PREFIX = "[cry-debug]";

export const logCryDebug = (message: string, payload?: Record<string, unknown>): void => {
	if (!CRY_DEBUG_ENABLED) {
		return;
	}

	if (payload) {
		console.log(CRY_DEBUG_PREFIX, message, payload);
		return;
	}

	console.log(CRY_DEBUG_PREFIX, message);
};
