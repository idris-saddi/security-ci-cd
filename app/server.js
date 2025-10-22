const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 3000;

// Limiter global pour réduire le risque de DoS/ReDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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

const server = app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Réduire les timeouts pour limiter l'impact d'opérations longues
server.headersTimeout = 15000; // 15s
server.requestTimeout = 15000; // 15s