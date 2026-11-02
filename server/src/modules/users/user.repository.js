import { User } from "./user.model.js";
import { Session } from "../auth/session.model.js";

const findUserById = async (userId) => {
	return User.findById(userId);
};

const findUserByIdWithPassword = async (userId) => {
	return User.findById(userId).select("+password");
};

const updateProfile = async (userId, updates) => {
	return User.findByIdAndUpdate(
		userId,
		{ $set: updates },
		{ new: true, runValidators: true },
	);
};

const revokeOtherSessions = async (userId, currentSessionTokenHash) => {
	const query = { user: userId, isRevoked: false };
	if (currentSessionTokenHash) query.refreshToken = { $ne: currentSessionTokenHash };
	return Session.updateMany(query, { isRevoked: true });
};

export const userRepository = {
	findUserById,
	findUserByIdWithPassword,
	updateProfile,
	revokeOtherSessions,
}
