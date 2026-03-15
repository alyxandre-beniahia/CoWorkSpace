/**
 * Charge .env.test avant les tests d'intégration/fonctionnels pour que
 * DATABASE_URL pointe vers la base de test et non la base de développement.
 * Ainsi les données de test ne polluent pas la vraie base.
 */
const path = require('path');
const fs = require('fs');

module.exports = function globalSetup() {
  const envTestPath = path.resolve(__dirname, '../../.env.test');
  if (fs.existsSync(envTestPath)) {
    const content = fs.readFileSync(envTestPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let value = trimmed.slice(eq + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
  // Si DATABASE_URL n'est pas défini (ni par .env.test ni par le shell), forcer une base de test
  // pour éviter d'écrire dans la base de dev par erreur.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test';
  }
};
