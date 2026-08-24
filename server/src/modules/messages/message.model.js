import mongoose from "mongoose";
import { MESSAGE_ROLES, MESSAGE_STATUS } from "../../shared/constants/message.js";

const messageSchema = new mongoose.Schema({

    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
        index: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    role: {
        type: String,
        enum: Object.values(MESSAGE_ROLES),
        required: true,
        index: true,
    },

    content: {
        type: String,
        default: "",
        trim: true,
    },

    attachments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
        },
    ],

    provider: {
        type: String,
        default: null,
    },

    model: {
        type: String,
        default: null,
    },

    status: {
        type: String,
        enum: Object.values(MESSAGE_STATUS),
        default: MESSAGE_STATUS.COMPLETED,
    },

    tokenUsage: {
        prompt: {
            type: Number,
            default: 0,
        },

        completion: {
            type: Number,
            default: 0,
        },

        total: {
            type: Number,
            default: 0,
        },
    },

    metadata: {
        finishReason: {
            type: String,
            default: null,
        },

        latency: {
            type: Number,
            default: null,
        },

        safety: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        error: {
            code: {
                type: String,
                default: null,
            },

            message: {
                type: String,
                default: null,
            },

            retryable: {
                type: Boolean,
                default: false,
            },
        },
    },

}, {
    timestamps: true,
    versionKey: false,
});

messageSchema.index({ chat: 1, createdAt: 1 });




export const Message = mongoose.model("Message", messageSchema);