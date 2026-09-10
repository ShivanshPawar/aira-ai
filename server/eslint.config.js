export default [
	{
		files: ["src/**/*.js", "scripts/**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				AbortController: "readonly",
				Buffer: "readonly",
				console: "readonly",
				process: "readonly",
			},
		},
		rules: {
			"no-undef": "error",
			"no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
				},
			],
		},
	},
];
