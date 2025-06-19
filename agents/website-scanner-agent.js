const cheerio = require('cheerio');

module.exports = {
  run: async (input) => {
    if (!input || !input.url) {
      throw new Error('Missing required field: url');
    }

    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${input.url}: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const content = $(el).attr('content');
      if (name && content) {
        metadata[name.toLowerCase()] = content;
      }
    });
    metadata.title = $('title').first().text();

    const headings = {};
    ['h1','h2','h3','h4','h5','h6'].forEach(tag => {
      headings[tag] = $(tag).map((_, el) => $(el).text().trim()).get();
    });

    const openGraph = {};
    Object.keys(metadata).forEach(key => {
      if (key.startsWith('og:')) {
        openGraph[key] = metadata[key];
      }
    });

    const links = { internal: [], external: [] };
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      if (href.startsWith('http') && !href.startsWith(input.url)) {
        links.external.push(href);
      } else {
        links.internal.push(href);
      }
    });

    return {
      metadata,
      headings,
      openGraph,
      links
    };
  }
};
