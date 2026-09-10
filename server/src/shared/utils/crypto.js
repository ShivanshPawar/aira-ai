import crypto from "crypto";

export const hashToken = (token) => {
	// Refresh tokens remain usable credentials, so persist a one-way digest instead.
	return crypto
		.createHash("sha256")
		.update(token)
		.digest("hex");
}
