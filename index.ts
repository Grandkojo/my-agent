import { stepCountIs, streamText } from "ai";
//import the google module from the ai-sdk package
import {google} from "@ai-sdk/google";
import {SYSTEM_PROMPT} from "./prompts";
import {getFileChangesInDirectoryTool, generateCommitMessageTool, writeReviewToFileTool} from "./tools";

const codeReviewAgent = async (prompt: string) => {
    const result = streamText({
      model: google("models/gemini-2.5-flash"),
      prompt,
      system: SYSTEM_PROMPT,
      tools: {
        getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
        generateCommitMessageTool: generateCommitMessageTool,
        writeReviewToFileTool: writeReviewToFileTool,
      },
      stopWhen: stepCountIs(10),
    });
  
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  };

  // Specify which directory the code review agent should review changes in your prompt
await codeReviewAgent(
    "Review the code changes in '../my-agent' directory, make your reviews and suggestions file by file, give a commit message, and write the review into a file",
  );