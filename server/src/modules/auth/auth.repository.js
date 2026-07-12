import { User } from "../../models/user.model.js";
import { Session } from '../../models/session.model.js';

export const authRepository = {
    async createUser(userData) {
        return User.create(userData);
    },

    async findUserByEmail(email, includePassword = false) {
        const query = User.findOne({ email });

        if (includePassword) {
            query.select("+password");
        }

        return query
    },

    async findUserById(userId) {
        return User.findById(userId);
    },

    async createSession(sessionData) {
        return Session.create(sessionData);
    },

    async findSessionByToken(hashedToken) {
        return Session.findOne({
            refreshToken: hashedToken,
            isRevoked: false,
        });
    },

    async revokeSession(sessionId) {
        return Session.findByIdAndUpdate(
            sessionId,
            { isRevoked: true },
            { new: true }
        );
    }

};