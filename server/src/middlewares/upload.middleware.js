import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

export const uploadSingleFile = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (error) {
      return next(error);
    }

    req.file = req.files?.[0];

    return next();
  });
};
