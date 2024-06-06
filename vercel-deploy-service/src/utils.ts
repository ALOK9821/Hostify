import { exec } from "child_process";
import path from "path";

/**
 * Builds a project by running `npm install` and `npm run build` in the specified directory
 * @param id - The unique ID representing the project directory
 * @returns A Promise that resolves when the build process is complete
 */
export function buildProject(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        const command = `cd ${projectPath} && npm install && npm run build`;

        const child = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Build process failed for project ${id}:`, error);
                reject(new Error(`Build process failed: ${error.message}`));
                return;
            }

            if (stderr) {
                console.error(`Build stderr for project ${id}:`, stderr);
            }

            if (stdout) {
                console.log(`Build stdout for project ${id}:`, stdout);
            }

            resolve();
        });

        child.stdout?.on("data", (data) => {
            console.log(`stdout: ${data}`);
        });

        child.stderr?.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });

        child.on("close", (code) => {
            if (code !== 0) {
                console.error(`Build process exited with code ${code} for project ${id}`);
                reject(new Error(`Build process exited with code ${code}`));
            } else {
                resolve();
            }
        });
    });
}
