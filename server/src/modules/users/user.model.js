import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { ROLES } from "../../shared/constants/roles.js";
import { AUTH_PROVIDERS } from "../../shared/constants/authProviders.js";

const avatarSchema = new mongoose.Schema({
	fileId: {
		type: String,
		default: null,
	},
	url: {
		type: String,
		default: null,

	},
}, { _id: false }
);

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		min: 3,
		max: 50,
	},

	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		index: true,
	},

	password: {
		type: String,
		required: function () {
			return this.authProvider === AUTH_PROVIDERS.LOCAL;
		},
		min: 8,
		select: false,
	},

	avatar: {
		type: avatarSchema,
		default: () => ({}),
	},

	role: {
		type: String,
		enum: Object.values(ROLES),
		default: ROLES.USER,
	},

	authProvider: {
		type: String,
		enum: Object.values(AUTH_PROVIDERS),
		default: AUTH_PROVIDERS.LOCAL,
	},

	isVerified: {
		type: Boolean,
		default: false,
	},

	lastLogin: {
		type: Date,
		default: null,
	},

}, {
	timestamps: true,
	versionKey: false,
});

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	// Hash only changed local passwords so password hashes are never hashed twice.
	this.password = await bcrypt.hash(this.password, 12)

});

userSchema.methods.comparePassword = async function (
	candidatePassword
) {
	return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toJSON", {
	transform: (doc, ret) => {
		// Model queries may explicitly include password, but API responses never should.
		delete ret.password;
		return ret;
	},
});

export const User = mongoose.model("User", userSchema);
