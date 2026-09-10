import { downloadUtil } from "../download.util.js";

// Cap attachment text to leave room for the chat history and the assistant response.
const MAX_CHARACTERS = 50000;

const buildParts = async (attachment) => {

	const markdown = await downloadUtil.downloadAsText(
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
			// Keep the document label so the model interprets the text as source material.
			text:
				`The following is a Markdown document.

${content}`,
		},
	];

};

export const markdownHandler = {
	buildParts,
};
