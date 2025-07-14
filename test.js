const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('API test OK');
});

app.listen(PORT, () => {
  console.log(`Serveur test en écoute sur le port ${PORT}`);
});
