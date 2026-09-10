export const asyncHandler = (handler) => {
	return async (req, res, next) => {
		try {
			await handler(req, res, next);
		} catch (error) {
			// Forward async failures to Express instead of leaving the request pending.
			next(error);
		}
	};
};
