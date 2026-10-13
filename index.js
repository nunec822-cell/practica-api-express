const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});