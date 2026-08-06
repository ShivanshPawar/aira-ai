import mongoose from "mongoose"
import { AI_MODELS, AI_PROVIDERS } from "../../shared/constants/ai.js";

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
        default: "Untitled",
        maxlength: 120,
    },

    provider: {
        type: String,
        enum: Object.values(AI_PROVIDERS),
        default: AI_PROVIDERS.GEMINI,
    },

    model: {
        type: String,
        default: AI_MODELS.GEMINI_FLASH,
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
        default: Date.now,
        index: true
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

}, {
    timestamps: true,
    versionKey: false,
});

chatSchema.index({
    user: 1,
    lastMessageAt: -1
});

export const Chat = mongoose.model("Chat", chatSchema);