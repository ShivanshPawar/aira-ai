import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    refreshToken: {
        type: String,
        required: true,
    },

    userAgent: {
        type: String,
        default: "",
    },

    ipAddress: {
        type: String,
        default: "",
    },

    isRevoked: {
        type: Boolean,
        default: false,
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    versionKey: false,
})

export const Session = mongoose.model("Session", sessionSchema);
