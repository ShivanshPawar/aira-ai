import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",

    "application/pdf",

    "text/plain",

    "text/markdown",
];

const fileFilter = (req, file, cb) => {
    if (
        !allowedMimeTypes.includes(file.mimetype)
    ) {

        return cb(
            new Error("Unsupported file type")
        );
    }

    cb(null, true);
};

export const upload = multer({


    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
    },

    fileFilter,
});