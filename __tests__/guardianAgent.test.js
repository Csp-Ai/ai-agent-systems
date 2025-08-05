const { readCollection, writeDocument } = require('../functions/db');
jest.mock('../functions/db', () => ({
  readCollection: jest.fn(),
  writeDocument: jest.fn()
}));

const guardianAgent = require('../agents/guardian-agent');

describe('guardian-agent', () => {
  test('flags misaligned agents and writes proposals', async () => {
    readCollection.mockResolvedValue([
      { agent: 'good', input: 'success', output: 'all good' },
      { agent: 'bad', input: 'error fail', output: 'oops' }
    ]);

    const result = await guardianAgent.run();

    expect(result.misaligned).toContain('bad');
    expect(result.proposals).toEqual(
      expect.arrayContaining([
        { agent: 'bad', suggestion: 'Tone deviates negatively from norms' }
      ])
    );
    expect(writeDocument).toHaveBeenCalledWith(
      'guardian',
      'proposals',
      { data: result.proposals }
    );
  });
});
