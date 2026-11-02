const toGroqRole = (role) => {
	const normalizedRole = String(role ?? "user").toLowerCase();

	// Stored roles may be upper-case constants, but Groq only accepts lower-case API roles.
	if (normalizedRole === "assistant") {
		return "assistant";
	}

	if (normalizedRole === "system") {
		return "system";
	}

	return "user";
};

const buildGroqMessages = (
	conversation,
	systemPrompt = null
) => {
	const messages = conversation.map((message) => ({
		role: toGroqRole(message.role),
		content: message.content,
	}));

	if (systemPrompt) {
		messages.unshift({
			role: "system",
			content: systemPrompt,
		});
	}

	return messages;
};

export {
	buildGroqMessages,
};
