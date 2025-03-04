import fs from 'fs';
import { Models } from 'openai/resources/models.mjs';

function generateSchema(fileName) {
  // Read the entire file content as a string
  const content = fs.readFileSync(fileName, 'utf8');

  // Extract header information (Description and Version)
  let description = '';
  let version = '';
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('* Description:')) {
      description = line.replace('* Description:', '').trim();
    } else if (line.includes('* Version:')) {
      version = line.replace('* Version:', '').trim();
    }
    if (description && version) break;
  }

  // Extract the JSDoc comment block that contains @param tags
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//;
  const jsdocMatch = content.match(jsdocRegex);
  const params = [];
  if (jsdocMatch) {
    const jsdocContent = jsdocMatch[1];
    // Regular expression to capture type, name, and description for each parameter
    const paramRegex = /@param\s+\{([^}]+)\}\s+(\w+)\s*-\s*(.*)/g;
    let match;
    while ((match = paramRegex.exec(jsdocContent)) !== null) {
      params.push({
        type: match[1].trim(),
        name: match[2].trim(),
        description: match[3].trim()
      });
    }
  }

  // Extract the function name from the function declaration.
  // This regex looks for patterns like: "const add = function add(..."
  const funcRegex = /const\s+(\w+)\s*=\s*function\s+\w+\s*\(/;
  const funcMatch = content.match(funcRegex);
  const functionName = funcMatch ? funcMatch[1] : "unknownFunction";

  // Map JSDoc types to JSON Schema types (default mapping, can be extended)
  const typeMapping = {
    "float": "number",
    "number": "number",
    "string": "string"
  };

  // Build the JSON schema for the function parameters
  const properties = {};
  const required = [];
  for (const param of params) {
    const schemaType = typeMapping[param.type] || "string"; // default to "string" if type unknown
    properties[param.name] = {
      type: schemaType,
      description: param.description
    };
    required.push(param.name);
  }

  // Construct the final OpenAI tool schema
  const openAISchema = {
    name: functionName,
    description: `${description} Version: ${version}`,
    parameters: {
      type: "object",
      properties,
      required
    }
  };

  return openAISchema;
}
module.exports = generateSchema;
// Example usage:
//const schema = generateSchema('tool01.js');
//console.log(JSON.stringify(schema, null, 2));
