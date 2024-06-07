import { S3 } from "aws-sdk";
import fs from "fs";
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

/**
 * Uploads a file to S3
 * @param fileName - The name of the file to be saved in S3
 * @param localFilePath - The local path of the file to be uploaded
 */
export const uploadFile = async (fileName: string, localFilePath: string) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);

        const response = await s3.upload({
            Body: fileContent,
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: fileName,
        }).promise();

        console.log("File uploaded successfully:", response);
    } catch (error) {
        console.error("Error in uploading file:", error);
        throw new Error("File upload failed");
    }
};
