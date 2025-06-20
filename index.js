const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

const distDir = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
