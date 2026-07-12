import { User } from "../../models/user.model.js";

const findUserById = async (userId) => {
    return User.findById(userId);
};

export const userRepository = {
    findUserById,
}