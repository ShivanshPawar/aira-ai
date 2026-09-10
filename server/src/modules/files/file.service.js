import { storageService } from "../../services/storage/storage.service.js";
import { fileRepository } from "./file.repository.js";
import { FILE_PROVIDER, FILE_STATUS, FILE_TYPES } from "./file.constants.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import {
	getFileExtension,
	isSupportedUploadMimeType,
	isTextMimeType,
	resolveUploadMimeType,
} from "./file-upload.utils.js";

const getFileType = (mimeType) => {
	if (mimeType.startsWith("image/")) {
		return FILE_TYPES.IMAGE;
	}

	if (mimeType === "application/pdf") {
		return FILE_TYPES.DOCUMENT;
	}

	if (mimeType === "text/markdown") {
		return FILE_TYPES.MARKDOWN;
	}

	if (isTextMimeType(mimeType)) {
		return FILE_TYPES.TEXT;
	}

	return FILE_TYPES.OTHER;
};

const hasPrefix = (buffer, bytes) => {
	return bytes.every((byte, index) => buffer[index] === byte);
};

const hasIsoBaseMediaBrand = (buffer, brands) => {
	// AVIF and HEIC store their format identifier in the ISO Base Media header.
	return (
		buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
		brands.includes(buffer.subarray(8, 12).toString("ascii"))
	);
};

const assertFileContentMatchesMimeType = (file, mimeType) => {
	const buffer = file?.buffer;

	if (!Buffer.isBuffer(buffer) || !buffer.length) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"Uploaded file is empty or unreadable.",
		);
	}

	// Check known file signatures so a client cannot bypass validation by only
	// claiming an allowed MIME type in the multipart request.
	const signatures = {
		"image/jpeg": [0xff, 0xd8, 0xff],
		"image/png": [0x89, 0x50, 0x4e, 0x47],
		"image/webp": [0x52, 0x49, 0x46, 0x46],
		"image/gif": [0x47, 0x49, 0x46, 0x38],
		"image/bmp": [0x42, 0x4d],
		"image/x-icon": [0x00, 0x00, 0x01, 0x00],
		"application/pdf": [0x25, 0x50, 0x44, 0x46],
	};

	if (signatures[mimeType]) {
		if (!hasPrefix(buffer, signatures[mimeType])) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"File contents do not match the declared type.",
			);
		}

		if (
			mimeType === "image/webp" &&
			buffer.subarray(8, 12).toString("ascii") !== "WEBP"
		) {
			// RIFF is shared by multiple formats, so its WebP marker needs a second check.
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"File contents do not match the declared type.",
			);
		}

		return;
	}

	if (
		(mimeType === "image/tiff" &&
			!hasPrefix(buffer, [0x49, 0x49, 0x2a, 0x00]) &&
			!hasPrefix(buffer, [0x4d, 0x4d, 0x00, 0x2a])) ||
		(mimeType === "image/avif" &&
			!hasIsoBaseMediaBrand(buffer, ["avif", "avis"])) ||
		((mimeType === "image/heic" || mimeType === "image/heif") &&
			!hasIsoBaseMediaBrand(buffer, ["heic", "heix", "hevc", "hevx", "mif1"]))
	) {
		// These formats use different headers, but each must prove it matches the
		// declared image type before it is sent to external storage.
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"File contents do not match the declared type.",
		);
	}

	if (mimeType === "image/svg+xml") {
		// SVG is text-based, so inspect its opening content instead of looking for
		// a binary signature like the other image formats use.
		const svgStart = buffer
			.subarray(0, Math.min(buffer.length, 1024))
			.toString("utf8")
			.trimStart()
			.toLowerCase();

		if (!svgStart.includes("<svg")) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"File contents do not match the declared type.",
			);
		}

		return;
	}

	if (isTextMimeType(mimeType) && buffer.includes(0)) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"File contents do not match the declared type.",
		);
	}
};

const uploadFile = async (userId, file) => {
	if (!file) {
		throw new ApiError(HTTP_STATUS.BAD_REQUEST, "File is required.");
	}

	// Some clients report known files as application/octet-stream. Resolve a
	// usable MIME type from the filename extension before checking the file bytes.
	const mimeType = resolveUploadMimeType(file);

	if (!isSupportedUploadMimeType(mimeType)) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"Supported uploads are images, text files, Markdown files, and PDFs.",
		);
	}

	const normalizedFile = {
		...file,
		mimetype: mimeType,
	};

	// Validate the actual content after normalizing the MIME type, not just the
	// client-provided multipart metadata.
	assertFileContentMatchesMimeType(normalizedFile, mimeType);

	// Upload first so the database never marks a file READY when storage failed.
	const uploaded = await storageService.upload(
		normalizedFile,
		FILE_PROVIDER.IMAGEKIT,
	);

	const savedFile = await fileRepository.createFile({
		user: userId,

		originalName: uploaded.originalName,

		fileName: uploaded.fileName,

		mimeType: uploaded.mimeType,

		extension: getFileExtension(uploaded.fileName),

		fileType: getFileType(uploaded.mimeType),

		size: uploaded.size,

		provider: uploaded.provider,

		providerFileId: uploaded.providerFileId,

		url: uploaded.url,

		thumbnailUrl: uploaded.thumbnailUrl,

		status: FILE_STATUS.READY,
	});

	return savedFile;
};

const getFileById = async (fileId) => {
	const file = await fileRepository.findFileById(fileId);

	if (!file) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "File not found");
	}

	return file;
};

const getFilesByIds = async (fileIds = []) => {
	if (!fileIds.length) {
		return [];
	}

	return fileRepository.findFilesByIds(fileIds);
};

const verifyOwnership = async (userId, fileIds = []) => {
	if (!fileIds.length) {
		return [];
	}

	// Fetch every attachment at once so a missing ID cannot be silently ignored.
	const files = await fileRepository.findFilesByIds(fileIds);

	if (files.length !== fileIds.length) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "One or more files not found.");
	}

	for (const file of files) {
		// Ownership is checked per file to prevent one user from attaching another
		// user's private upload to a message.
		if (file.user.toString() !== userId.toString()) {
			throw new ApiError(HTTP_STATUS.FORBIDDEN, "You don't own this file.");
		}

		if (file.status !== FILE_STATUS.READY) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"File upload is not complete.",
			);
		}
	}

	return files;
};

const deleteFile = async (userId, fileId) => {
	const file = await getFileById(fileId);

	if (file.user.toString() !== userId.toString()) {
		throw new ApiError(HTTP_STATUS.FORBIDDEN, "Unauthorized");
	}

	// Remove the provider copy before deleting its record so failed remote cleanup
	// does not leave an unreachable file in storage.
	await storageService.remove(file.providerFileId, file.provider);

	await fileRepository.deleteFile(fileId);

	return true;
};

export const fileService = {
	uploadFile,
	getFileById,
	getFilesByIds,
	verifyOwnership,
	deleteFile,
};
