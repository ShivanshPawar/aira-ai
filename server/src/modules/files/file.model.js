import mongoose from "mongoose";

import {
	FILE_PROVIDER,
	FILE_STATUS,
	FILE_TYPES,
} from "./file.constants.js";

const fileSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		originalName: {
			type: String,
			required: true,
		},

		fileName: {
			type: String,
			required: true,
		},

		mimeType: {
			type: String,
			required: true,
		},

		extension: {
			type: String,
		},

		fileType: {
			type: String,
			enum: Object.values(FILE_TYPES),
			required: true,
		},

		size: {
			type: Number,
			required: true,
		},

		provider: {
			type: String,
			enum: Object.values(FILE_PROVIDER),
			default: FILE_PROVIDER.IMAGEKIT,
		},

		providerFileId: {
			type: String,
			default: null,
		},

		url: {
			type: String,
			default: null,
		},

		thumbnailUrl: {
			type: String,
			default: null,
		},

		status: {
			type: String,
			enum: Object.values(FILE_STATUS),
			default: FILE_STATUS.UPLOADING,
		},
	},
	{
		timestamps: true,
	}
);

export const File = mongoose.model("File", fileSchema);