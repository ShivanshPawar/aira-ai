const MAX_TITLE_LENGTH = 120;
const TITLE_SUFFIX = "...";

export const generateChatTitle = (message) => {
	if (typeof message !== "string") {
		return "New Chat";
	}

	const normalized = message.replace(/\s+/g, " ").trim();

	if (!/[\p{L}\p{N}]/u.test(normalized)) {
		return "New Chat";
	}

	const title = normalized.replace(
		/^([^\p{L}\p{N}]*)([\p{L}\p{N}])/u,
		(_, prefix, firstCharacter) => prefix + firstCharacter.toLocaleUpperCase(),
	);

	if (title.length <= MAX_TITLE_LENGTH) {
		return title;
	}

	const titlePrefix = title.slice(0, MAX_TITLE_LENGTH - TITLE_SUFFIX.length);
	const lastWordBoundary = titlePrefix.lastIndexOf(" ");
	const truncatedTitle =
		lastWordBoundary > 0
			? titlePrefix.slice(0, lastWordBoundary)
			: titlePrefix;

	return `${truncatedTitle.trimEnd()}${TITLE_SUFFIX}`;
};
