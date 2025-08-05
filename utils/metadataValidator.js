const Ajv = require('ajv');
const schema = require('../agents/agent-metadata.schema.json');

const ajv = new Ajv({ allErrors: true });
const validateEntry = ajv.compile(schema);

function validateAgentEntry(id, entry) {
  if (!validateEntry(entry)) {
    const errors = ajv.errorsText(validateEntry.errors, { separator: ', ' });
    throw new Error(`Invalid metadata for agent '${id}': ${errors}`);
  }
  return true;
}

function validateAgentMetadata(metadata) {
  for (const [id, entry] of Object.entries(metadata)) {
    validateAgentEntry(id, entry);
  }
  return true;
}

module.exports = { validateAgentEntry, validateAgentMetadata };
