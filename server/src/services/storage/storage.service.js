import { imagekitProvider } from "./providers/imagekit.provider.js";
import { localProvider } from "./providers/local.provider.js";

const providers = {
    IMAGEKIT: imagekitProvider,
    LOCAL: localProvider,
};

const getProvider = (provider = "IMAGEKIT") => {

    const storageProvider = providers[provider];

    if (!storageProvider) {
        throw new Error(`Unknown storage provider: ${provider}`);
    }

    return storageProvider;
};

const upload = async (
    file,
    provider = "IMAGEKIT"
) => {

    return getProvider(provider).upload(file);
};

const remove = async (
    fileId,
    provider = "IMAGEKIT"
) => {

    return getProvider(provider).delete(fileId);
};

export const storageService = {
    upload,
    remove,
};