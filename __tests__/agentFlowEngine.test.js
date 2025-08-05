const fs = require('fs');
const path = require('path');

jest.mock('../functions/db', () => ({
  writeDocument: jest.fn().mockResolvedValue()
}));
const { writeDocument } = require('../functions/db');

jest.mock('../agents/guardian-agent', () => ({
  run: jest.fn().mockResolvedValue({ output: 'ok', explanation: 'done' })
}));
const mockAgent = require('../agents/guardian-agent');

const { runAgentFlow } = require('../core/agentFlowEngine');

describe('runAgentFlow', () => {
  const flowPath = path.join(__dirname, '..', 'flows', 'test-flow.json');

  beforeAll(() => {
    const flowConfig = {
      id: 'test-flow',
      steps: [
        {
          id: 'step1',
          agent: 'guardian-agent',
          input: { data: '$input.url' },
          onError: 'abort'
        }
      ]
    };
    fs.writeFileSync(flowPath, JSON.stringify(flowConfig, null, 2));
  });

  afterAll(() => {
    fs.unlinkSync(flowPath);
  });

  test('executes steps and records output', async () => {
    const res = await runAgentFlow('http://example.com', 'run1', {
      configId: 'test-flow',
      userId: 'tester'
    });

    expect(mockAgent.run).toHaveBeenCalledWith({ data: 'http://example.com' });
    expect(writeDocument).toHaveBeenCalled();
    expect(res.completed).toBe(true);
    expect(res.steps[0]).toMatchObject({
      id: 'step1',
      agent: 'guardian-agent',
      output: 'ok',
      explanation: 'done',
      success: true
    });
  });
});
