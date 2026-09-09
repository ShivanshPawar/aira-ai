import mongoose from "mongoose"
import { AI_PROVIDERS, DEFAULT_MODEL, DEFAULT_PROVIDER } from "../ai/ai.constants.js";

const chatSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    title: {
        type: String,
        trim: true,
        default: "New Chat",
        maxlength: 120,
    },

    provider: {
        type: String,
        enum: Object.values(AI_PROVIDERS),
        default: DEFAULT_PROVIDER,
    },

    model: {
        type: String,
        default: DEFAULT_MODEL,
    },

    systemPrompt: {
        type: String,
        default: null,
    },

    isPinned: {
        type: Boolean,
        default: false,
    },

    isArchived: {
        type: Boolean,
        default: false,
    },

    lastMessageAt: {
        type: Date,
        default: null,
        index: true,
    },

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },

    messageCount: {
        type: Number,
        default: 0
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

    summary: {
        content: {
            type: String,
            default: "",
        },

        updatedAt: {
            type: Date,
            default: null,
        },

        tokenUsage: {
            type: Number,
            default: 0,
        },
    },

}, {
    timestamps: true,
    versionKey: false,
});

chatSchema.index({
    user: 1,
    lastMessageAt: -1
});

export const Chat = mongoose.model("Chat", chatSchema);