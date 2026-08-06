import { buildContextWindow } from "./utils/context-window.js";

export const buildConversation = (history) => {

    const context = buildContextWindow(history);

    return context.map((message) => ({

        role: message.role === "USER"
            ? "user"
            : "model",

        content: message.content,

        attachments: message.attachments || [],

    }));;

};