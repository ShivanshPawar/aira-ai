import { userRepository } from "./user.repository.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { fileService } from "../files/file.service.js";
import { FILE_TYPES } from "../files/file.constants.js";
import { hashToken } from "../../shared/utils/crypto.js";

const getCurrentUser = async (userId) => {
	const user = await userRepository.findUserById(userId);

	if (!user) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
	};

	return user.toJSON();

}

const updateProfile = async (userId, updates) => {
	const profileUpdates = {};

	if (updates.name !== undefined) profileUpdates.name = updates.name;

	if (updates.avatarFileId) {
		const [file] = await fileService.verifyOwnership(userId, [updates.avatarFileId]);
		if (file.fileType !== FILE_TYPES.IMAGE) {
			throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Avatar must be an image.");
		}
		profileUpdates.avatar = { fileId: file._id.toString(), url: file.url };
	}

	const user = await userRepository.updateProfile(userId, profileUpdates);

	if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

	return user.toJSON();
};

const changePassword = async (userId, credentials, refreshToken) => {
	const user = await userRepository.findUserByIdWithPassword(userId);
	if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

	if (!(await user.comparePassword(credentials.currentPassword))) {
		throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Current password is incorrect.");
	}

	user.password = credentials.newPassword;
	await user.save();
	await userRepository.revokeOtherSessions(userId, refreshToken ? hashToken(refreshToken) : null);
	return user.toJSON();
};

export const userService = {
	getCurrentUser,
	updateProfile,
	changePassword,
}


