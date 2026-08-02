import axios from "axios";

const downloadAsBuffer = async (url) => {

    const response = await axios.get(url, {
        responseType: "arraybuffer",
    });

    return Buffer.from(response.data);

};

const downloadAsBase64 = async (url) => {

    const buffer = await downloadAsBuffer(url);

    return buffer.toString("base64");

};

const downloadAsText = async (url) => {

    const response = await axios.get(url, {
        responseType: "text",
    });

    return response.data;

};

export const downloadUtil = {
    downloadAsBuffer,
    downloadAsBase64,
    downloadAsText,
};