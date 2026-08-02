import { FILE_TYPES } from "../../files/file.constants.js";

import { imageHandler } from "./handlers/image.handler.js";
import { pdfHandler } from "./handlers/pdf.handler.js";
import { textHandler } from "./handlers/text.handler.js";
import { markdownHandler } from "./handlers/markdown.handler.js";

const handlers = {
    [FILE_TYPES.IMAGE]: imageHandler,
    [FILE_TYPES.DOCUMENT]: pdfHandler,
    [FILE_TYPES.TEXT]: textHandler,
    [FILE_TYPES.MARKDOWN]: markdownHandler,
};

const buildParts = async (message) => {
    const parts = [];

    if (message.content?.trim()) {
        parts.push({
            text: message.content,
        });
    }

    for (const attachment of message.attachments || []) {
        const handler = handlers[attachment.fileType];

        if (!handler) {
            continue;
        }

        const handlerParts =
            await handler.buildParts(
                attachment
            );

        parts.push(...handlerParts);
    }

    return parts;
};

export const buildGeminiContents = async (conversation) => {
    const contents = [];

    for (const message of conversation) {
        contents.push({
            role: message.role,
            parts: await buildParts(message),
        });
    }

    return contents;
};