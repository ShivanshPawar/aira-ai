const STOP_WORDS = new Set([
	"a",
	"an",
	"the",
	"is",
	"am",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",

	"i",
	"me",
	"my",
	"mine",

	"you",
	"your",

	"we",
	"our",

	"they",
	"their",

	"this",
	"that",
	"these",
	"those",

	"to",
	"of",
	"for",
	"with",
	"in",
	"on",
	"at",
	"by",
	"from",
	"into",
	"about",
	"over",

	"how",
	"what",
	"why",
	"when",
	"where",
	"which",

	"can",
	"could",
	"should",
	"would",
	"will",

	"please",

	"help",
	"explain",
	"tell",
	"show",
	"give",
	"need",
	"want"
]);

export const generateChatTitle = (message) => {

	if (!message) {
		return "New Chat";
	}

	// Normalize punctuation before extracting stable keywords for the automatic title.
	const cleaned = message
		.replace(/[^\w\s.-]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	const words = cleaned.split(" ");

	const keywords = words.filter((word) => {

		const lower = word.toLowerCase();

		return (
			word.length > 2 &&
			!STOP_WORDS.has(lower)
		);

	});

	if (!keywords.length) {
		return "New Chat";
	}

	return keywords
		.slice(0, 5)
		.map(word =>
			word.charAt(0).toUpperCase() +
			word.slice(1)
		)
		.join(" ");
};
