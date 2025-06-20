const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function generateCoverPage(companyName = '', sessionId = '', agentIds = []) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  // Company name in bold at the top
  const titleFontSize = 24;
  const titleWidth = boldFont.widthOfTextAtSize(companyName, titleFontSize);
  page.drawText(companyName, {
    x: (width - titleWidth) / 2,
    y: height - 50,
    size: titleFontSize,
    font: boldFont,
  });

  // Timestamp of generation
  const tsFontSize = 12;
  const timestamp = new Date().toLocaleString();
  page.drawText(`Generated: ${timestamp}`, {
    x: 50,
    y: height - 80,
    size: tsFontSize,
    font: regularFont,
  });

  // Session ID if provided
  if (sessionId) {
    page.drawText(`Session: ${sessionId}`, {
      x: 50,
      y: height - 100,
      size: tsFontSize,
      font: regularFont,
    });
  }

  // Optional agent avatar grid
  if (Array.isArray(agentIds) && agentIds.length) {
    const cell = 50;
    const pad = 10;
    let x = pad;
    let y = height - 150;
    const cols = Math.floor((width - pad * 2) / (cell + pad));

    agentIds.forEach((id, idx) => {
      page.drawRectangle({
        x,
        y,
        width: cell,
        height: cell,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      const label = String(id);
      const textWidth = regularFont.widthOfTextAtSize(label, 10);
      page.drawText(label, {
        x: x + (cell - textWidth) / 2,
        y: y + cell / 2 - 5,
        size: 10,
        font: regularFont,
      });
      x += cell + pad;
      if ((idx + 1) % cols === 0) {
        x = pad;
        y -= cell + pad;
      }
    });
  }

  // Footer
  page.drawText('Powered by AI Agent Systems', {
    x: 50,
    y: 30,
    size: 10,
    font: regularFont,
  });

  return page;
}

module.exports = { generateCoverPage };
