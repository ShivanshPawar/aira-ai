const normalizeTokenCount = (value) => {
	const count = Number(value);

	return Number.isFinite(count) && count >= 0 ? Math.trunc(count) : 0;
};

const normalizeTokenUsage = (usage = {}) => {
	const prompt = normalizeTokenCount(usage.prompt);
	const completion = normalizeTokenCount(usage.completion);
	const reportedTotal = normalizeTokenCount(usage.total);

	// Some providers omit totals, while others include additional tokens in them.
	return {
		prompt,
		completion,
		total: Math.max(prompt + completion, reportedTotal),
	};
};

export { normalizeTokenCount, normalizeTokenUsage };
