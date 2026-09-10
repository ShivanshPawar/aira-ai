import path from "path";

const EXTENSION_MIME_TYPES = Object.freeze({
	".avif": "image/avif",
	".bmp": "image/bmp",
	".gif": "image/gif",
	".heic": "image/heic",
	".heif": "image/heif",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png": "image/png",
	".svg": "image/svg+xml",
	".tif": "image/tiff",
	".tiff": "image/tiff",
	".webp": "image/webp",
	".pdf": "application/pdf",
	".csv": "text/csv",
	".log": "text/plain",
	".markdown": "text/markdown",
	".md": "text/markdown",
	".txt": "text/plain",
	".json": "application/json",
	".xml": "application/xml",
	".yaml": "application/yaml",
	".yml": "application/yaml",
});

const TEXT_APPLICATION_MIME_TYPES = new Set([
	"application/json",
	"application/xml",
	"application/yaml",
	"application/x-yaml",
]);

const getFileExtension = (fileName = "") => {
	return path.extname(fileName).toLowerCase();
};

const isSupportedUploadMimeType = (mimeType = "") => {
	return (
		mimeType === "application/pdf" ||
		mimeType.startsWith("image/") ||
		mimeType.startsWith("text/") ||
		TEXT_APPLICATION_MIME_TYPES.has(mimeType)
	);
};

const isTextMimeType = (mimeType = "") => {
	return mimeType.startsWith("text/") || TEXT_APPLICATION_MIME_TYPES.has(mimeType);
};

const resolveUploadMimeType = (file) => {
	const reportedMimeType = String(file?.mimetype ?? "").toLowerCase();
	const extensionMimeType = EXTENSION_MIME_TYPES[
		getFileExtension(file?.originalname)
	];

	// Browsers often label Markdown as plain text, so use its unambiguous extension.
	if (
		extensionMimeType === "text/markdown" &&
		(reportedMimeType === "text/plain" ||
			reportedMimeType === "application/octet-stream")
	) {
		return extensionMimeType;
	}

	if (
		reportedMimeType === "application/octet-stream" ||
		!reportedMimeType
	) {
		// Generic binary MIME types carry no useful information; the extension is the fallback.
		return extensionMimeType ?? reportedMimeType;
	}

	return reportedMimeType;
};

export {
	getFileExtension,
	isSupportedUploadMimeType,
	isTextMimeType,
	resolveUploadMimeType,
};
