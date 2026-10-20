const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Ruta base
app.get('/', (req, res) => {
  res.send('El servidor está en línea');
});

// GET todos
app.get('/api/recursos', async (req, res) => {
  try {
    const [libros] = await db.query('SELECT * FROM libros');
    res.json(libros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// GET por id
app.get('/api/recursos/:id', async (req, res) => {
  try {
    const [filas] = await db.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    res.json(filas[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// POST crear
app.post('/api/recursos', async (req, res) => {
  try {
    const { nombre, autor } = req.body;
    if (!nombre || !autor) {
      return res.status(400).json({ mensaje: 'nombre y autor son obligatorios' });
    }
    const [resultado] = await db.query(
      'INSERT INTO libros (nombre, autor) VALUES (?, ?)',
      [nombre, autor]
    );
    res.status(201).json({ id: resultado.insertId, nombre, autor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// PUT actualizar
app.put('/api/recursos/:id', async (req, res) => {
  try {
    const [filas] = await db.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    const libro = filas[0];
    const nombre = req.body.nombre !== undefined ? req.body.nombre : libro.nombre;
    const autor = req.body.autor !== undefined ? req.body.autor : libro.autor;

    await db.query(
      'UPDATE libros SET nombre = ?, autor = ? WHERE id = ?',
      [nombre, autor, req.params.id]
    );
    res.json({ id: libro.id, nombre, autor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// DELETE eliminar
app.delete('/api/recursos/:id', async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM libros WHERE id = ?', [req.params.id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    res.json({ mensaje: 'Recurso eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// IMPORTAR (JSON o CSV)
app.post('/api/recursos/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'Adjunta un archivo en el campo "archivo"' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const rutaTemporal = req.file.path;

  try {
    let registros = [];

    if (ext === '.json') {
      registros = JSON.parse(fs.readFileSync(rutaTemporal, 'utf-8'));
      if (!Array.isArray(registros)) {
        throw new Error('El JSON debe ser un arreglo de objetos');
      }
    } else if (ext === '.csv') {
      registros = await new Promise((resolve, reject) => {
        const filas = [];
        fs.createReadStream(rutaTemporal)
          .pipe(csv())
          .on('data', (fila) => filas.push(fila))
          .on('end', () => resolve(filas))
          .on('error', reject);
      });
    } else {
      throw new Error('Formato no soportado. Usa .json o .csv');
    }

    if (registros.length === 0) {
      throw new Error('El archivo no contiene registros');
    }

    const valores = registros.map((r) => [r.nombre, r.autor]);
    const [resultado] = await db.query(
      'INSERT INTO libros (nombre, autor) VALUES ?',
      [valores]
    );

    res.status(200).json({
      mensaje: 'Importación exitosa',
      total: resultado.affectedRows
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: error.message });
  } finally {
    if (fs.existsSync(rutaTemporal)) fs.unlinkSync(rutaTemporal);
  }
});

// EXPORTAR (json o csv)
app.get('/api/recursos/exportar/:formato', async (req, res) => {
  try {
    const { formato } = req.params;
    const [libros] = await db.query('SELECT * FROM libros');

    if (formato === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
      return res.json(libros);
    }

    if (formato === 'csv') {
      const parser = new Parser();
      const csvData = libros.length ? parser.parse(libros) : '';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
      return res.send(csvData);
    }

    res.status(400).json({ mensaje: 'Formato inválido. Usa json o csv' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});