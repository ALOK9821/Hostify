import { createClient, commandOptions } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Redis clients
const subscriber = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
const publisher = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const connectRedis = async () => {
    try {
        await subscriber.connect();
        await publisher.connect();
    } catch (error) {
        console.error("Redis connection failed:", error);
        process.exit(1); // Exit the process if Redis connection fails
    }
};

// Main function to process build queue
async function main() {
    await connectRedis();

    setInterval(async () => {
        try {
            const res = await subscriber.brPop(
                commandOptions({ isolated: true }),
                'build-queue',
                0
            );
            
            // @ts-ignore
            const id = res.element;

            console.log(`Processing build for ID: ${id}`);

            // Download project files from S3
            await downloadS3Folder(`output/${id}`);

            // Build the project
            await buildProject(id);

            // Copy the final distribution to S3
            copyFinalDist(id);

            // Update the status in Redis
            await publisher.hSet("status", id, "deployed");

            console.log(`Build and deployment completed for ID: ${id}`);
        } catch (error) {
            console.error("Error processing build queue:", error);
        }
    }, 1000); // Check the queue every second
}

// Start the main process
main().catch((error) => {
    console.error("Failed to start the build process:", error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1); // Exit the process to avoid undefined states
});
