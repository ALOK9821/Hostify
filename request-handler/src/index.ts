import express from "express";
import { S3 } from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("Bucket name is not defined in the environment variables");
}

const app = express();

/**
 * GET /*
 * Serves files from S3 based on the request path and subdomain
 */
app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;

    try {
        const contents = await s3.getObject({
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: `dist/${id}${filePath}`,
        }).promise();

        const type = filePath.endsWith(".html")
            ? "text/html"
            : filePath.endsWith(".css")
            ? "text/css"
            : "application/javascript";

        res.set("Content-Type", type);

        res.send(contents.Body);
    } catch (error) {
        console.error("Error fetching file from S3:", error);
        res.status(404).send("File not found");
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
