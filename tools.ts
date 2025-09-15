import {z} from "zod";
import { tool } from "ai";
import { simpleGit } from "simple-git";
import { writeFileSync } from "fs";

const fileChange = z.object({
    rootDir: z.string().min(1).describe("The root directory"),
});

const commitMessage = z.object({
    diffs: z.array(z.object({ file: z.string(), diff: z.string() })),
});

const writeReviewToFileSchema = z.object({
    review: z.string().min(1).describe("The review"),
    filename: z.string().optional().describe("The output filename (defaults to 'review.md')"),
});

type FileChange = z.infer<typeof fileChange>;
type CommitMessage = z.infer<typeof commitMessage>;
type WriteReviewToFile = z.infer<typeof writeReviewToFileSchema>;

const excludeFiles = ["dist", "bun.lock"];

async function getFileChangesInDirectory({ rootDir }: FileChange) {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  const diffs: { file: string; diff: string }[] = [];

  for (const file of summary.files) {
    if (excludeFiles.includes(file.file)) continue;
    const diff = await git.diff(["--", file.file]);
    diffs.push({ file: file.file, diff });
  }

  return diffs;
}

async function generateCommitMessage({ diffs }: CommitMessage) {
    // Analyze the changes to generate a meaningful commit message
    const changedFiles = diffs.map(diff => diff.file);
    const hasNewFiles = changedFiles.some(file => file.includes('new file'));
    const hasModifiedFiles = changedFiles.some(file => !file.includes('new file'));
    
    let message = "feat: ";
    
    if (hasNewFiles && hasModifiedFiles) {
        message += "Add new features and update existing code";
    } else if (hasNewFiles) {
        message += "Add new features";
    } else {
        message += "Update existing code";
    }
    
    // Add file count
    message += ` (${changedFiles.length} file${changedFiles.length > 1 ? 's' : ''})`;
    
    // Add file list
    if (changedFiles.length <= 5) {
        message += `\n\nFiles changed:\n${changedFiles.map(file => `- ${file}`).join('\n')}`;
    }
    
    return message;
}

async function writeReviewToFile({ review, filename = "review.md" }: WriteReviewToFile) {
    const markdownContent = `# Code Review\n\n${review}`;
    writeFileSync(filename, markdownContent, 'utf8');
    return `Review written to ${filename}`;
}

export const writeReviewToFileTool = tool({
    description: "Writes a code review to a markdown file",
    inputSchema: writeReviewToFileSchema,
    execute: writeReviewToFile,
  });

export const getFileChangesInDirectoryTool = tool({
    description: "Gets the code changes made in given directory",
    inputSchema: fileChange,
    execute: getFileChangesInDirectory,
  });

export const generateCommitMessageTool = tool({
    description: "Generates a conventional commit message based on the code changes",
    inputSchema: commitMessage,
    execute: generateCommitMessage,
  });