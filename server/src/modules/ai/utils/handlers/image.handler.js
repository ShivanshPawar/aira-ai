import { downloadUtil } from "../download.util.js";

const buildParts = async (attachment) => {

    const base64 = await downloadUtil.downloadAsBase64(
        attachment.url
    );

    return [
        {
            inlineData: {
                mimeType: attachment.mimeType,
                data: base64,
            },
        },
    ];

};

export const imageHandler = {
    buildParts,
};