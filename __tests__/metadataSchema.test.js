const { validateAgentEntry } = require('../utils/metadataValidator');

describe('agent metadata schema', () => {
  test('valid metadata passes', () => {
    const entry = {
      name: 'Test Agent',
      description: 'Just a test',
      inputs: {},
      outputs: {},
      category: 'test',
      enabled: true,
      version: '1.0.0',
      createdBy: 'tester',
      lastUpdated: '2025-01-01',
      critical: false,
      locales: ['en'],
      locale: 'en-US',
      misaligned: false
    };
    expect(() => validateAgentEntry('test-agent', entry)).not.toThrow();
  });

  test('invalid metadata throws', () => {
    const entry = {
      description: 'Missing name',
      inputs: {},
      outputs: {},
      category: 'test',
      enabled: true,
      version: '1.0.0',
      createdBy: 'tester',
      lastUpdated: '2025-01-01',
      critical: false,
      locales: ['en'],
      locale: 'en-US',
      misaligned: false
    };
    expect(() => validateAgentEntry('bad-agent', entry)).toThrow();
  });
});
