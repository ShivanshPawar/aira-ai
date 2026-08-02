import { PDFParse } from "pdf-parse";
import { downloadUtil } from "../download.util.js";

const MAX_CHARACTERS = 50000;

const buildParts = async (attachment) => {
    const buffer = await downloadUtil.downloadAsBuffer(
        attachment.url
    );

    const parser = new PDFParse({
        data: buffer,
    });

    try {
        const document = await parser.getText();

        const text = document.text
            ?.trim()
            .slice(0, MAX_CHARACTERS);

        if (!text) {
            return [
                {
                    text: "The uploaded PDF contains no extractable text.",
                },
            ];
        }

        return [
            {
                text,
            },
        ];
    } catch (error) {
        console.error("PDF extraction error:", error);

        throw new Error("Failed to extract text from PDF.");
    } finally {
        if (parser?.destroy) {
            await parser.destroy();
        }
    }
};

export const pdfHandler = {
    buildParts,
};