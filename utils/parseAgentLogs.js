function parseAgentLogs(logMessages = []) {
  return logMessages.map(msg => {
    const fromMatch = msg.match(/\[?([\w-]+)\]?/);
    const toMatch = msg.match(/to \[?([\w-]+)\]?/) || msg.match(/->\s*([\w-]+)/);
    const from = fromMatch ? fromMatch[1] : null;
    const to = toMatch ? toMatch[1] : null;
    return { from, to, timestamp: Date.now(), type: 'communication' };
  }).filter(e => e.from && e.to);
}

module.exports = parseAgentLogs;
