import { downloadUtil } from "../download.util.js";

// Cap attachment text to leave room for the chat history and the assistant response.
const MAX_CHARACTERS = 50000;

const buildParts = async (attachment) => {

	const text = await downloadUtil.downloadAsText(
		attachment.url
	);

	const content = text
		?.trim()
		.slice(0, MAX_CHARACTERS);

	if (!content) {
		return [
			{
				text: "The uploaded text file is empty.",
			},
		];
	}

	return [
		{
			text: content,
		},
	];

};

export const textHandler = {
	buildParts,
};
