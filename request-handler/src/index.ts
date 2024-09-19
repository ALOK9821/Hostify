import express from "express";
import { S3 } from "aws-sdk";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT", "AWS_BUCKET_NAME", "PORT"];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is required but not defined`);
    }
});

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});

const bucketName = process.env.AWS_BUCKET_NAME as string;
const app = express();

// Middleware: security headers
app.use(helmet());

// Middleware: gzip compression
app.use(compression());

// Middleware: rate limiting to prevent DDOS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware: logging requests
app.use(morgan("combined"));

/**
 * GET /*
 * Serves files from S3 based on the request path and subdomain
 */
app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    const filePath = req.path;

    // Validate and sanitize the file path to prevent path traversal attacks
    const sanitizedPath = path.normalize(`dist/${id}${filePath}`).replace(/^(\.\.(\/|\\|$))+/, '');

    try {
        const contents = await s3
            .getObject({
                Bucket: bucketName,
                Key: sanitizedPath,
            })
            .promise();

        const ext = path.extname(filePath).toLowerCase();
        const mimeType =
            ext === ".html"
                ? "text/html"
                : ext === ".css"
                ? "text/css"
                : ext === ".js"
                ? "application/javascript"
                : "application/octet-stream";

        // Set cache headers for better performance
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=31536000"); // 1 year cache duration
        res.set("ETag", contents.ETag);

        res.send(contents.Body);
    } catch (error) {
        console.error("Error fetching file from S3:", error);
        // In production, don't expose internal error details
        res.status(404).send("File not found");
    }
});

// Global error handler (if needed)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
