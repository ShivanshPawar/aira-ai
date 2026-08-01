import { File } from "./file.model.js";

const createFile = (data) => {
    return File.create(data);
};

const findById = (fileId) => {
    return File.findById(fileId);
};

const updateFile = (fileId, data) => {
    return File.findByIdAndUpdate(
        fileId,
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const findFileById = (fileId) => {
    return File.findById(fileId);
};

const findFilesByIds = (fileIds) => {
    return File.find({
        _id: { $in: fileIds },
    });
};

const deleteFile = (fileId) => {
    return File.findByIdAndDelete(fileId);
};

export const fileRepository = {
    createFile,
    findById,
    updateFile,
    findFileById,
    findFilesByIds,
    deleteFile,
};