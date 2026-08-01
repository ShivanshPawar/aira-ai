import axios from "axios";

const downloadAsBase64 = async (url) => {

    const response = await axios.get(url, {
        responseType: "arraybuffer",
    });

    return Buffer
        .from(response.data)
        .toString("base64");
};

const buildImagePart = async (attachment) => {

    const base64 = await downloadAsBase64(
        attachment.url
    );

    return {
        inlineData: {
            mimeType: attachment.mimeType,
            data: base64,
        },
    };

};

const buildParts = async (message) => {

    const parts = [];

    if (message.content?.trim()) {

        parts.push({
            text: message.content,
        });

    }

    for (const attachment of message.attachments) {

        if (
            attachment.fileType !== "IMAGE"
        ) {

            continue;

        }

        parts.push(
            await buildImagePart(
                attachment
            )
        );

    }

    return parts;

};

export const buildGeminiContents = async (
    conversation
) => {

    const contents = [];

    for (const message of conversation) {

        contents.push({

            role: message.role,

            parts: await buildParts(
                message
            ),

        });

    }

    return contents;

};