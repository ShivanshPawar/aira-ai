import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
	// Keep the file in memory because it is validated and forwarded to storage immediately.
	storage,

	limits: {
		fileSize: 10 * 1024 * 1024,
		files: 1,
	},
});

export const uploadSingleFile = (req, res, next) => {
	// Accept any field name so browser and Postman clients are not coupled to one key,
	// while the multer limit still guarantees exactly one uploaded file.
	upload.any()(req, res, (error) => {
		if (error) {
			return next(error);
		}

		req.file = req.files?.[0];

		return next();
	});
};
