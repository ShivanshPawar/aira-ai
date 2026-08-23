import path from "path";

import { storageService } from "../../services/storage/storage.service.js";
import { fileRepository } from "./file.repository.js";
import { FILE_PROVIDER, FILE_STATUS, FILE_TYPES } from "./file.constants.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { ApiError } from "../../shared/errors/ApiError.js";

const getFileType = (mimeType) => {

    if (mimeType.startsWith("image/")) {
        return FILE_TYPES.IMAGE;
    }

    if (mimeType === "application/pdf") {
        return FILE_TYPES.DOCUMENT;
    }

    if (mimeType.startsWith("text/")) {
        return FILE_TYPES.TEXT;
    }

    return FILE_TYPES.OTHER;
};

const uploadFile = async (
    userId,
    file
) => {

    if (!file) {
        throw new Error("File is required");
    }

    const uploaded = await storageService.upload(
        file,
        FILE_PROVIDER.IMAGEKIT
    );

    const savedFile = await fileRepository.createFile({

        user: userId,

        originalName: uploaded.originalName,

        fileName: uploaded.fileName,

        mimeType: uploaded.mimeType,

        extension: path.extname(uploaded.fileName),

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
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "File not found"
        );
    }

    return file;
};

const getFilesByIds = async (fileIds = []) => {

    if (!fileIds.length) {
        return [];
    }

    return fileRepository.findFilesByIds(fileIds);
};

const verifyOwnership = async (
    userId,
    fileIds = []
) => {

    if (!fileIds.length) {
        return [];
    }

    const files = await fileRepository.findFilesByIds(fileIds);

    if (files.length !== fileIds.length) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "One or more files not found."
        );
    }

    for (const file of files) {

        if (file.user.toString() !== userId.toString()) {

            throw new ApiError(
                HTTP_STATUS.FORBIDDEN,
                "You don't own this file."
            );

        }

        if (file.status !== FILE_STATUS.READY) {

            throw new ApiError(
                HTTP_STATUS.BAD_REQUEST,
                "File upload is not complete."
            );

        }

    }

    return files;
};

const deleteFile = async (
    userId,
    fileId
) => {

    const file = await getFileById(fileId);

    if (file.user.toString() !== userId.toString()) {

        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "Unauthorized"
        );

    }

    await storageService.remove(
        file.providerFileId,
        file.provider
    );

    await fileRepository.deleteFile(fileId);

    return true;
};

export const fileService = {
    uploadFile,
    getFileById,
    getFilesByIds,
    verifyOwnership,
    deleteFile
};