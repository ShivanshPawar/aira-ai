import { ZodError } from "zod";
import { ApiResponse } from "../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from './../shared/constants/httpStatus.js';

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            req.validatedData = await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return ApiResponse.error(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    "Validation Error",
                    error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    }))
                )
            }
            next(error);
        }
    }
}