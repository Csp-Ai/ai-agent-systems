const agent = require('../agents/guardian-agent');
(async () => {
  try {
    const res = await agent.run();
    console.log(JSON.stringify(res, null, 2));
    if (res && res.error) process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
