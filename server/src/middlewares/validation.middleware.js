import { ZodError } from "zod";
import { ApiResponse } from "../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../shared/constants/httpStatus.js";

export const validate = (schema) => {
	return async (req, res, next) => {
		try {
			// Controllers read this parsed copy so transforms and strict schemas are never bypassed.
			req.validatedData = await schema.parseAsync({
				body: req.body,
				params: req.params,
				query: req.query,
			});

			return next();

		} catch (error) {

			if (error instanceof ZodError) {
				// Return field-level details without exposing Zod's internal error structure.
				return ApiResponse.error(
					res,
					HTTP_STATUS.BAD_REQUEST,
					"Validation Error",
					error.issues.map((issue) => ({
						field: issue.path.join("."),
						message: issue.message,
					}))
				);
			}

			return next(error);
		}
	};
};
