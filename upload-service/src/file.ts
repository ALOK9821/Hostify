import fs from "fs";
import path from "path";

export const getAllFiles = (folderPath: string): string[] => {
    let response: string[] = [];

    try {
        const allFilesAndFolders = fs.readdirSync(folderPath);

        allFilesAndFolders.forEach(file => {
            const fullFilePath = path.join(folderPath, file);
            try {
                const stat = fs.statSync(fullFilePath);
                if (stat.isDirectory()) {
                    response = response.concat(getAllFiles(fullFilePath));
                } else {
                    response.push(fullFilePath);
                }
            } catch (fileError) {
                console.error(`Failed to stat file: ${fullFilePath}`, fileError);
            }
        });
    } catch (readDirError) {
        console.error(`Failed to read directory: ${folderPath}`, readDirError);
    }

    return response;
}