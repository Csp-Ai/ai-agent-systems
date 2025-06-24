const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, '.env.production'))) {
  dotenv.config({ path: path.join(__dirname, '.env.production') });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 8080;

const distDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distDir));

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Serve the frontend entry for any route not matched by static assets
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
