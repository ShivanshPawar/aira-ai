import { userRepository } from "./user.repository.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

const getCurrentUser = async (userId) => {
    const user = await userRepository.findUserById(userId);

    if (!user) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    };

    return user.toJSON();

}

export const userService = {
    getCurrentUser,
}


