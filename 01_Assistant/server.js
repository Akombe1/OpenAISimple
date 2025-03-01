import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let assistantId = null;
let existingAssistants = {};

/**
 * Get existing Assistants and check if the given name exists.
 */
async function findAssistantByName(assistantName) {
  try {
    const assistantsList = await openai.beta.assistants.list();
    const assistant = assistantsList.data.find(a => a.name === assistantName);
    return assistant ? assistant.id : null;
  } catch (error) {
    console.error("Error fetching assistants list:", error);
    return null;
  }
}

/**
 * Get or Create an Assistant by Name
 */
app.post("/assistant", async (req, res) => {
  try {
    const { assistantName, systemMessage, model } = req.body;

    // Check if the assistant already exists
    let existingId = await findAssistantByName(assistantName);
    if (existingId) {
      assistantId = existingId;
      return res.json({ assistantId, status: "Assistant found" });
    }

    // Create a new Assistant if it does not exist
    const assistant = await openai.beta.assistants.create({
      name: assistantName,
      instructions: systemMessage,
      model: model,
    });

    assistantId = assistant.id;
    existingAssistants[assistantName] = assistantId;
    res.json({ assistantId, status: "Assistant created successfully" });

  } catch (error) {
    console.error("Error creating/getting assistant:", error);
    res.status(500).json({ error: "Failed to create assistant" });
  }
});

/**
 * Create a new thread.
 */
app.post("/thread", async (req, res) => {
  try {
    // Create a new thread without adding the user prompt yet
    const thread = await openai.beta.threads.create();
    res.json({ threadId: thread.id, status: "New thread created" });

  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

/**
 * Add user message to the thread and Run the Assistant
 */
app.post("/run", async (req, res) => {
  try {
    const { threadId, userPrompt } = req.body;

    if (!assistantId) {
      return res.status(400).json({ error: "No Assistant has been created yet." });
    }

    // Add the user prompt to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userPrompt,
    });

    // Run the Assistant on the thread
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    const runId = run.id;
    let runStatus = run.status;
    let messages = [];

    // Poll until run is complete
    while (runStatus !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const runStatusCheck = await openai.beta.threads.runs.retrieve(threadId, runId);
      runStatus = runStatusCheck.status;
    }

    // Retrieve messages after completion
    const threadMessages = await openai.beta.threads.messages.list(threadId);
    messages = threadMessages.data;

    res.json({ messages, status: "Response received from Assistant" });

  } catch (error) {
    console.error("Error running Assistant:", error);
    res.status(500).json({ error: "Failed to run Assistant" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});