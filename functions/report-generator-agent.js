// functions/report-generator-agent.js

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'logs');
const REPORTS_FILE = path.join(REPORTS_DIR, 'reports.json');

function ensureReportsFile() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, '[]', 'utf8');
  }
}

function readReports() {
  ensureReportsFile();
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

function appendReport(entry) {
  const reports = readReports();
  reports.push(entry);
  writeReports(reports);
}

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

      const markdownReport =
        `# 🧠 AI Transformation Report for ${clientName}\n\n` +
        `**Generated:** ${timestamp()}\n\n` +
        `This report consolidates findings from multiple AI agents and outlines recommendations to enhance your business using automation and intelligence.\n\n` +
        sections.join('\n\n') +
        `\n---\n\n_Report compiled by AI Agent Systems._`;

      appendReport({
        timestamp: new Date().toISOString(),
        clientName,
        report: markdownReport,
      });

      return { result: markdownReport };

    } catch (err) {
      return { error: `Report generation failed: ${err.message}` };
    }
  }
};
