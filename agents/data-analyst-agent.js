const computeStats = (arr) => {
  const n = arr.length;
  const mean = arr.reduce((sum, v) => sum + v, 0) / n;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  return { count: n, mean, min, max, std };
};

module.exports = {
  run: async (input) => {
    try {
      const { agentOutputs = [] } = input;

      if (!Array.isArray(agentOutputs)) {
        return { error: 'Expected agentOutputs to be an array.' };
      }

      const summaries = [];
      const numericProps = {};

      agentOutputs.forEach((out, idx) => {
        if (!out || typeof out !== 'object') return;
        // collect summary
        if (typeof out.summary === 'string') {
          summaries.push(`Output ${idx + 1}: ${out.summary}`);
        } else {
          summaries.push(`Output ${idx + 1}: ${JSON.stringify(out)}`);
        }
        // collect numeric values
        for (const [k, v] of Object.entries(out)) {
          if (typeof v === 'number' && isFinite(v)) {
            if (!numericProps[k]) numericProps[k] = [];
            numericProps[k].push(v);
          }
        }
      });

      const statistics = {};
      const outliers = {};
      for (const [key, values] of Object.entries(numericProps)) {
        const stats = computeStats(values);
        statistics[key] = {
          count: stats.count,
          mean: Number(stats.mean.toFixed(3)),
          min: stats.min,
          max: stats.max,
          std: Number(stats.std.toFixed(3))
        };
        outliers[key] = values
          .map((v, i) => ({ v, i }))
          .filter(({ v }) => Math.abs(v - stats.mean) > 2 * stats.std)
          .map(({ i, v }) => ({ index: i, value: v }));
      }

      const correlations = {};
      const keys = Object.keys(numericProps);
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = keys[i];
          const b = keys[j];
          const arr1 = numericProps[a];
          const arr2 = numericProps[b];
          const n = Math.min(arr1.length, arr2.length);
          if (n < 2) continue;
          const mean1 = statistics[a].mean;
          const mean2 = statistics[b].mean;
          let cov = 0, var1 = 0, var2 = 0;
          for (let k = 0; k < n; k++) {
            cov += (arr1[k] - mean1) * (arr2[k] - mean2);
            var1 += Math.pow(arr1[k] - mean1, 2);
            var2 += Math.pow(arr2[k] - mean2, 2);
          }
          cov /= n;
          var1 /= n;
          var2 /= n;
          const corr = cov / (Math.sqrt(var1) * Math.sqrt(var2) || 1);
          if (!correlations[a]) correlations[a] = {};
          correlations[a][b] = Number(corr.toFixed(3));
        }
      }

      const insights = [];
      for (const [a, pairs] of Object.entries(correlations)) {
        for (const [b, r] of Object.entries(pairs)) {
          if (Math.abs(r) >= 0.8) {
            insights.push(`${a} strongly correlates with ${b} (r=${r})`);
          }
        }
      }
      for (const [key, vals] of Object.entries(outliers)) {
        if (vals.length) {
          const idxs = vals.map(v => v.index).join(', ');
          insights.push(`Outliers detected in ${key} at indexes ${idxs}`);
        }
      }

      const summary = summaries.join('\n');
      return { summary, statistics, correlations, insights, outliers };
    } catch (err) {
      return { error: `Data analysis failed: ${err.message}` };
    }
  }
};
