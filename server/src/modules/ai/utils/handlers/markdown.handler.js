import { downloadUtil } from "../download.util.js";

const MAX_CHARACTERS = 50000;

const buildParts = async (attachment) => {

    const markdown =
        await downloadUtil.downloadAsText(
            attachment.url
        );

    const content = markdown
        ?.trim()
        .slice(0, MAX_CHARACTERS);

    if (!content) {
        return [
            {
                text: "The uploaded Markdown file is empty.",
            },
        ];
    }

    return [
        {
            text:
                `The following is a Markdown document.

${content}`,
        },
    ];

};

export const markdownHandler = {
    buildParts,
};