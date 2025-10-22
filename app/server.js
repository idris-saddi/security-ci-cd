const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World! Ceci est l\'application sécurisée.');
});

// ⚠️ Vulnérabilité intentionnelle pour le DAST : Injection de commande OS simple
app.get('/unsafe-route', (req, res) => {
  const user_input = req.query.cmd;
  // Ne faites JAMAIS cela dans un vrai code :
  const { exec } = require('child_process');
  exec(`echo ${user_input}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send(`Erreur: ${err.message}`);
    }
    res.send(`Résultat: ${stdout}`);
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});