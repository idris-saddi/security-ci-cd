const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World! Ceci est l\'application sécurisée.');
});

// Correction: suppression de l'exécution de commandes système et assainissement de l'entrée utilisateur
function sanitize(input) {
  if (typeof input !== 'string') return '';
  // Supprimer les caractères non imprimables et limiter la taille pour éviter les abus
  return input.replace(/[^\x20-\x7E]+/g, '').slice(0, 200);
}

app.get('/unsafe-route', (req, res) => {
  const raw = req.query.cmd ?? '';
  const user_input = sanitize(raw);
  // Répondre en texte brut pour éviter toute interprétation HTML côté client
  res.type('text/plain').send(`Résultat: ${user_input}`);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});