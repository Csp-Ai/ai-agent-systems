// functions/report-generator-agent.js

const fs = require('fs');
const path = require('path');

function formatSection(title, content) {
  return `### ${title}\n\n${content}\n`;
}

function timestamp() {
  return new Date().toISOString().split('T')[0];
}

module.exports = {
  run: async (input) => {
    try {
      const { results, clientName = "Client" } = input;

      if (!Array.isArray(results)) {
        return { error: "Expected input.results to be an array of agent responses." };
      }

      const sections = results.map(res => {
        const agentName = res.agent || 'Unnamed Agent';
        const summary = res.output?.summary || JSON.stringify(res.output || {}, null, 2);
        return formatSection(`Output from ${agentName}`, summary);
      });

      const markdownReport = `# 🧠 AI Transformation Report for ${clientName}\n\n` +
        `**Generated:** ${timestamp()}\n\n` +
        `This report consolidates findings from multiple AI agents and outlines recommendations to enhance your business using automation and intelligence.\n\n` +
        sections.join('\n\n') +
        `\n---\n\n_Report compiled by AI Agent Systems._`;

      return { result: markdownReport };

    } catch (err) {
      return { error: `Report generation failed: ${err.message}` };
    }
  }
};
