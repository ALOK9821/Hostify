import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
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
 * Downloads a folder from S3 to the local file system
 * @param prefix - The prefix (folder path) in S3
 */
export async function downloadS3Folder(prefix: string) {
    try {
        const allFiles = await s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Prefix: prefix,
        }).promise();

        const allPromises = allFiles.Contents?.map(({ Key }) => {
            return new Promise<void>(async (resolve, reject) => {
                if (!Key) {
                    resolve();
                    return;
                }

                const finalOutputPath = path.join(__dirname, Key);
                const outputFile = fs.createWriteStream(finalOutputPath);
                const dirName = path.dirname(finalOutputPath);

                if (!fs.existsSync(dirName)) {
                    fs.mkdirSync(dirName, { recursive: true });
                }

                s3.getObject({
                    Bucket: process.env.AWS_BUCKET_NAME as string,
                    Key,
                })
                    .createReadStream()
                    .pipe(outputFile)
                    .on("finish", resolve)
                    .on("error", reject);
            });
        }) || [];

        await Promise.all(allPromises);
        console.log("Download completed.");
    } catch (error) {
        console.error("Error downloading S3 folder:", error);
        throw new Error("Failed to download S3 folder");
    }
}

/**
 * Copies the final distribution folder to S3
 * @param id - The unique ID representing the distribution folder
 */
export function copyFinalDist(id: string) {
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);

    allFiles.forEach((file) => {
        uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file).catch(console.error);
    });
}

/**
 * Recursively gets all files in a folder
 * @param folderPath - The path to the folder
 * @returns An array of file paths
 */
const getAllFiles = (folderPath: string): string[] => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        } else {
            response.push(fullFilePath);
        }
    });

    return response;
};

/**
 * Uploads a file to S3
 * @param fileName - The name of the file to be saved in S3
 * @param localFilePath - The local path of the file to be uploaded
 */
const uploadFile = async (fileName: string, localFilePath: string) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const response = await s3.upload({
            Body: fileContent,
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: fileName,
        }).promise();
        console.log("File uploaded successfully:", response);
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("File upload failed");
    }
};
