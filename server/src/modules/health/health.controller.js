export const getHealth = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        data: {
            status: "Healthy",
            version: "1.0.0",
            timestamp: new Date().toISOString()
        },
    });
};