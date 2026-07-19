import { aiService } from "./modules/ai/ai.service.js";

const result = await aiService.generateResponse([
    {
        role: "user",
        parts: [
            {
                text: "Say hello !"
            }
        ]
    }
]);

console.log(result);