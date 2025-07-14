// 📦 Import des modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// 🔐 Configuration CORS
const corsOptions = {
  origin: [
    'https://yoonbii.vercel.app',
    'http://localhost:3000', // test local
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 🔗 Connexion MySQL via variables d'environnement
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion MySQL :', err);
    return;
  }
  console.log('✅ Connecté à la base MySQL');
});

// ✅ Fonction générique CRUD
const createCrudRoutes = (table, idField) => {
  const route = `/api/${table}`;
  const fullTable = table.replace(/_/g, ' ');

  app.get(route, (req, res) => {
    connection.query(`SELECT * FROM ${fullTable}`, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  app.post(route, (req, res) => {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (fields.length === 0) return res.status(400).json({ error: 'Champs requis manquants' });

    const placeholders = fields.map(() => '?').join(', ');
    const query = `INSERT INTO ${fullTable} (${fields.join(', ')}) VALUES (${placeholders})`;

    connection.query(query, values, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: `${table} ajouté`, id: results.insertId });
    });
  });

  app.put(`${route}/:id`, (req, res) => {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    const updates = fields.map(f => `${f} = ?`).join(', ');
    values.push(req.params.id);

    const query = `UPDATE ${fullTable} SET ${updates} WHERE ${idField} = ?`;
    connection.query(query, values, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `${table} modifié` });
    });
  });

  app.delete(`${route}/:id`, (req, res) => {
    connection.query(`DELETE FROM ${fullTable} WHERE ${idField} = ?`, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `${table} supprimé` });
    });
  });
};

// 🛠 CRUD pour chaque table
createCrudRoutes('bus', 'id_Bus');
createCrudRoutes('arret', 'id_Arret');
createCrudRoutes('ligne', 'id_Ligne');
createCrudRoutes('position_bus', 'id_Position');
createCrudRoutes('trajet', 'id_Trajet');
createCrudRoutes('avoir', 'id');
createCrudRoutes('desservir', 'id');
createCrudRoutes('effectuer', 'id');
createCrudRoutes('gerer', 'id');
createCrudRoutes('utilisateur', 'id');
createCrudRoutes('admin', 'id_Admin');

// 🚏 Recherche trajet
app.get('/api/trajet', (req, res) => {
  const { Point_Depart, Point_Arriver } = req.query;
  if (!Point_Depart || !Point_Arriver) {
    return res.status(400).json({ message: 'Champs manquants dans la requête' });
  }
  const sql = `
    SELECT t.id_Trajet, t.Point_Depart, t.Point_Arriver, l.Numero
    FROM trajet t
    JOIN ligne l ON t.Numero = l.Numero
    WHERE LOWER(t.Point_Depart) = LOWER(?) AND LOWER(t.Point_Arriver) = LOWER(?)
  `;
  connection.query(sql, [Point_Depart, Point_Arriver], (err, results) => {
    if (err) return res.status(500).json({ message: "Erreur serveur" });
    if (results.length === 0) return res.status(404).json({ message: "Aucun itinéraire trouvé" });
    res.json({ routes: results });
  });
});

// 🔐 Connexion admin
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  const ADMIN_LOGIN = process.env.ADMIN_LOGIN;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!login || !password) return res.status(400).json({ error: "Login et mot de passe requis" });
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    return res.json({ message: "Connexion réussie" });
  }
  res.status(401).json({ error: "Identifiants invalides" });
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 API en écoute sur http://${HOST}:${PORT}`);
});
