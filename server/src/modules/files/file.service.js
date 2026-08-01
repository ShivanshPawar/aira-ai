import path from "path";

import { storageService } from "../../services/storage/storage.service.js";
import { fileRepository } from "./file.repository.js";
import { FILE_PROVIDER, FILE_STATUS, FILE_TYPES } from "./file.constants.js";

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

export const fileService = {
    uploadFile,
};