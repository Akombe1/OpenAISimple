/**
 * server.js
 *
 * Minimal Express server using the new OpenAI v2 Node library and 
 * a functional "Conductor" pattern (no classes).
 *
 * Run with: node server.js
 * Ensure you have installed:
 *   npm install express openai node-fetch
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

/**
 * server.js
 * 
 * Run with: node server.js
 *
 * Dependencies:
 *   npm install express openai node-fetch
 */


// Create OpenAI client (v2)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const PORT = 3001
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from "public"
app.use(express.static('public'));

/**
 * In-memory store of Agents:
 *   Each agent is an object:
 *   {
 *     id,          // number or unique
 *     name,        // string
 *     model,       // string
 *     instructions // string
 *     tools: [
 *       { name: 'exampleTool' }, { name: 'anotherTool' }
 *     ]
 *   }
 */
let agents = [];

// A few example tools, just returning strings
function exampleTool(params) {
  return `exampleTool invoked with params: ${JSON.stringify(params)}`;
}

function anotherTool(params) {
  return `anotherTool invoked with params: ${JSON.stringify(params)}`;
}

/**
 * Dispatch tool call by name
 */
function executeTool(toolName, params) {
  switch (toolName) {
    case 'exampleTool':
      return exampleTool(params);
    case 'anotherTool':
      return anotherTool(params);
    default:
      return `No known tool: ${toolName}`;
  }
}

/**
 * createAgent() - functional factory
 */
function createAgent({ name, model, instructions }) {
  return {
    // ID can be the next array index or a small unique
    id: Date.now(),
    name,
    model,
    instructions,
    tools: [],
  };
}

/**
 * getCompletionFromAgent(agent, messages)
 *  - calls OpenAI chat.completions.create
 */
async function getCompletionFromAgent(agent, messages) {
  const systemMsg = {
    role: 'system',
    content: agent.instructions || 'You are a helpful agent.',
  };
  const chatMessages = [systemMsg, ...messages];
  
  try {
    const response = await openai.chat.completions.create({
      model: agent.model,
      messages: chatMessages,
      // If using function calls, you'd also specify "functions" or "function_call" here
    });
    return response.choices[0].message;
  } catch (err) {
    console.error('OpenAI Error:', err);
    throw err;
  }
}

/**
 * runMultiAgentConductor({
 *   agentIds: number[],
 *   messages,
 *   max_turns
 * })
 *
 * A simple round-robin approach among the given agentIds,
 * passing messages in a loop. 
 *
 * Example logic:
 *   - On each turn, pick next agent by index
 *   - Get the completion
 *   - If it calls a tool, handle it
 *   - If no function_call, we may stop
 */
async function runMultiAgentConductor({ agentIds, messages, max_turns = 6 }) {
  const result = {
    messages: [...messages],
  };

  let turnCount = 0;
  let agentIndex = 0;

  while (turnCount < max_turns) {
    const agentId = agentIds[agentIndex];
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      result.messages.push({
        role: 'system',
        content: `Agent with id=${agentId} not found. Stopping.`,
      });
      break;
    }

    // Ask this agent for a response
    const agentMessage = await getCompletionFromAgent(agent, result.messages);

    // Push the assistant message
    result.messages.push({
      role: 'assistant',
      name: agent.name, // track which agent responded
      content: agentMessage.content || '',
    });

    // Check for function call
    // (If using function_call, parse it. Example:)
    // if (agentMessage.function_call) {
    //   const { name: toolName, arguments: toolArgs } = agentMessage.function_call;
    //   // check if agent has that tool
    //   const tool = agent.tools.find(t => t.name === toolName);
    //   if (tool) {
    //     const toolResult = executeTool(toolName, JSON.parse(toolArgs || "{}"));
    //     result.messages.push({
    //       role: 'function',
    //       name: toolName,
    //       content: toolResult
    //     });
    //   } else {
    //     // tool not found
    //     result.messages.push({
    //       role: 'system',
    //       content: `Agent ${agent.name} tried to call unknown tool: ${toolName}`
    //     });
    //   }
    // } else {
    //   // no function call => maybe end
    //   break;
    // }

    // For demonstration, if there's no function_call property, we do next agent
    // Round-robin: move agentIndex
    agentIndex = (agentIndex + 1) % agentIds.length;
    turnCount++;
  }

  return result;
}

/* ------------------------------------------------------------------
 *  ROUTES
 * ------------------------------------------------------------------ */

/**
 * GET /agents
 *  returns the list of agents
 */
app.get('/agents', (req, res) => {
  res.json(agents);
});

/**
 * POST /create-agent
 *  - name, model, instructions
 * Creates and stores a new agent
 */
app.post('/create-agent', (req, res) => {
  const { name, model, instructions } = req.body;
  if (!name || !model) {
    return res.status(400).json({ error: 'name and model are required' });
  }

  const newAgent = createAgent({ name, model, instructions });
  agents.push(newAgent);

  return res.json(newAgent);
});

/**
 * POST /add-tool
 *  - agentId, toolName
 * Adds a tool to the specified agent
 */
app.post('/add-tool', (req, res) => {
  const { agentId, toolName } = req.body;
  if (!agentId || !toolName) {
    return res.status(400).json({ error: 'agentId and toolName are required' });
  }

  const agent = agents.find(a => a.id === Number(agentId));
  if (!agent) {
    return res.status(404).json({ error: `Agent with id=${agentId} not found.` });
  }

  // In a real system, you'd verify that toolName is a valid known tool, or define it dynamically
  if (agent.tools.some(t => t.name === toolName)) {
    return res.status(400).json({ error: 'Tool already assigned to this agent' });
  }

  agent.tools.push({ name: toolName });
  res.json({ success: true, agent });
});

/**
 * POST /start-conversation
 *  - agentIds[] : array of IDs in the order you want them to talk
 *  - userInput : the initial user message
 *  - maxTurns : optional
 */
app.post('/start-conversation', async (req, res) => {
  try {
    const { agentIds, userInput, maxTurns } = req.body;
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({ error: 'agentIds must be a non-empty array' });
    }

    // Build initial messages
    const messages = [
      { role: 'user', content: userInput || '' },
    ];

    const conversation = await runMultiAgentConductor({
      agentIds: agentIds.map(n => Number(n)), 
      messages,
      max_turns: maxTurns || 6,
    });

    return res.json(conversation);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* ------------------------------------------------------------------
 * Start the server
 * ------------------------------------------------------------------ */
function startServer() {
  const port = PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer();
