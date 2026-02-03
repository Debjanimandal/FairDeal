import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Code Execution Utilities
 */
export class CodeExecutionManager {
  async executeCode(files: any[]) {
    // Create a temporary directory
    const tempDir = path.join(process.cwd(), "temp_execution", `job-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write files to temp dir
      for (const file of files) {
        const filePath = path.join(tempDir, file.originalname);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.buffer);
      }

      // Detect and run
      let command = "";
      if (fs.existsSync(path.join(tempDir, "package.json"))) {
        // Simple install and test/run
        command = `cd "${tempDir}" && npm install && (npm test || node index.js)`;
      } else if (fs.existsSync(path.join(tempDir, "main.py"))) {
        command = `cd "${tempDir}" && python main.py`;
      } else if (fs.existsSync(path.join(tempDir, "index.js"))) {
        command = `cd "${tempDir}" && node index.js`;
      } else if (fs.existsSync(path.join(tempDir, "App.java"))) {
        command = `cd "${tempDir}" && javac App.java && java App`;
      } else if (fs.existsSync(path.join(tempDir, "index.html"))) {
        // Serve HTML directly
        const htmlContent = fs.readFileSync(path.join(tempDir, "index.html"), "utf-8");
        // Cleanup immediately
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}

        return { type: "html", output: htmlContent };
      } else {
        // Check for any HTML file if index.html is missing
        const htmlFile = files.find((f) => f.originalname.endsWith(".html"));
        if (htmlFile) {
          const htmlContent = htmlFile.buffer.toString("utf-8");
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {}
          return { type: "html", output: htmlContent };
        }

        return {
          type: "unknown",
          output:
            "No runnable entry point found (package.json, main.py, index.js, App.java). Submitted files: " +
            files.map((f) => f.originalname).join(", "),
        };
      }

      // Execute
      return new Promise<any>((resolve) => {
        exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
          // Cleanup
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            console.error("Cleanup error", e);
          }

          if (error) {
            // Return stdout/stderr even on error as it might contain useful info
            resolve({
              type: "error",
              output: `Execution Error: ${error.message}\n\nOutput:\n${stdout}\n\nErrors:\n${stderr}`,
            });
          } else {
            resolve({ type: "success", output: stdout || "Execution completed with no output." });
          }
        });
      });
    } catch (err: any) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
      return { type: "error", output: err.message };
    }
  }
}

export const codeExecutionManager = new CodeExecutionManager();
