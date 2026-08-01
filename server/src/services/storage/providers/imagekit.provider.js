import path from "path";

import { imagekit } from "../../../config/imagekit.js";

export const imagekitProvider = {

    async upload(file) {

        const extension = path.extname(file.originalname);

        const uniqueName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}${extension}`;

        const result = await imagekit.upload({

            file: file.buffer,

            fileName: uniqueName,

            folder: "/aira-ai",

            useUniqueFileName: false,

        });

        return {

            provider: "IMAGEKIT",

            providerFileId: result.fileId,

            url: result.url,

            thumbnailUrl: result.thumbnailUrl,

            originalName: file.originalname,

            fileName: uniqueName,

            mimeType: file.mimetype,

            extension,

            size: file.size,

        };

    },

    async delete(fileId) {

        await imagekit.deleteFile(fileId);

    },

};