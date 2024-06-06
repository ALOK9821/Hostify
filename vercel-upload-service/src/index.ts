import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generateId } from "./utils";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";

const publisher = createClient();
const subscriber = createClient();

const connectRedis = async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
  } catch (error) {
    console.error("Redis connection failed:", error);
    process.exit(1);
  }
};
connectRedis();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * POST /deploy
 * Clones a git repository, uploads its files to AWS, and updates the deployment status in Redis.
 */
app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL is required" });
  }

  const id = generateId(); // Generate a unique ID for the deployment
  const repoPath = path.join(__dirname, `output/${id}`);

  try {
    await simpleGit().clone(repoUrl, repoPath);

    const files = getAllFiles(repoPath);

    // Upload each file to AWS
    for (const file of files) {
      try {
        await uploadFile(file.slice(__dirname.length + 1), file);
      } catch (uploadError) {
        console.error(`Failed to upload file: ${file}`, uploadError);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await publisher.lPush("build-queue", id);
    await publisher.hSet("status", id, "uploaded");

    res.json({ id });
  } catch (error) {
    console.error("Deployment failed:", error);
    res.status(500).json({ error: "Deployment failed. Please try again." });
  }
});

/**
 * GET /status
 * Retrieves the deployment status from Redis using the provided ID.
 */
app.get("/status", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    const status = await subscriber.hGet("status", id as string);

    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    res.json({ status });
  } catch (error) {
    console.error("Failed to get status:", error);
    res.status(500).json({ error: "Failed to get status. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
