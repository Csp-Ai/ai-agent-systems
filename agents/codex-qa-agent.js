module.exports = {
  run: async (input = {}) => {
    const { url, apiPath = '/run-agent', loginPath } = input;
    if (!url) {
      throw new Error('url is required');
    }

    const results = { homepage: {}, api: {}, login: {} };
    let success = true;

    // helper to fetch with timing
    async function timedFetch(target, options) {
      const start = Date.now();
      try {
        const res = await fetch(target, options);
        const time = Date.now() - start;
        return { ok: res.ok, status: res.status, time, text: await res.text() };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // homepage
    const homeRes = await timedFetch(url);
    results.homepage = homeRes;
    if (!homeRes.ok) success = false;

    // simple check for title tag
    if (homeRes.text) {
      const titleMatch = homeRes.text.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        results.homepage.title = titleMatch[1];
      }
      if (/error|exception/i.test(homeRes.text)) {
        results.homepage.errorText = true;
        success = false;
      }
    }

    // api check
    if (apiPath) {
      const apiUrl = url.replace(/\/$/, '') + apiPath;
      const apiRes = await timedFetch(apiUrl);
      results.api = apiRes;
      if (!apiRes.ok) success = false;
    }

    // login check
    if (loginPath) {
      const loginUrl = url.replace(/\/$/, '') + loginPath;
      const loginRes = await timedFetch(loginUrl);
      results.login = loginRes;
      if (!loginRes.ok) success = false;
    }

    const reportLines = [];
    if (results.homepage.ok) {
      reportLines.push(`Homepage loaded in ${results.homepage.time}ms`);
    } else {
      reportLines.push(`Homepage failed: ${results.homepage.status || results.homepage.error}`);
    }
    if (apiPath) {
      if (results.api.ok) {
        reportLines.push(`API responded with ${results.api.status} in ${results.api.time}ms`);
      } else {
        reportLines.push(`API request failed: ${results.api.status || results.api.error}`);
      }
    }
    if (loginPath) {
      if (results.login.ok) {
        reportLines.push(`Login page loaded in ${results.login.time}ms`);
      } else {
        reportLines.push(`Login check failed: ${results.login.status || results.login.error}`);
      }
    }

    return { success, report: reportLines.join('\n'), details: results };
  }
};
