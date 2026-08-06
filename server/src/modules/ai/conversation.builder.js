import { buildContextWindow } from "./utils/context-window.js";

export const buildConversation = (
    history,
    summary = ""
) => {

    const context = buildContextWindow(
        history,
        summary
    );

    return context.map((message) => ({

        role: message.role === "USER"
            ? "user"
            : message.role === "SYSTEM"
                ? "user"
                : "model",

        content: message.content,

        attachments:
            message.attachments || [],

    }));

};