const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Arreglo en memoria (catálogo de libros)
let libros = [
  { id: 1, nombre: 'Cien años de soledad', autor: 'Gabriel García Márquez' },
  { id: 2, nombre: 'El principito', autor: 'Antoine de Saint-Exupéry' },
  { id: 3, nombre: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes' }
];
let siguienteId = 4;

// Ruta base
app.get('/', (req, res) => {
  res.send('El servidor está en línea');
});

// GET todos
app.get('/api/recursos', (req, res) => {
  res.json(libros);
});

// GET por id
app.get('/api/recursos/:id', (req, res) => {
  const libro = libros.find(l => l.id === parseInt(req.params.id));
  if (!libro) return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  res.json(libro);
});

// POST crear
app.post('/api/recursos', (req, res) => {
  const { nombre, autor } = req.body;
  if (!nombre || !autor) {
    return res.status(400).json({ mensaje: 'nombre y autor son obligatorios' });
  }
  const nuevo = { id: siguienteId++, nombre, autor };
  libros.push(nuevo);
  res.status(201).json(nuevo);
});

// PUT actualizar
app.put('/api/recursos/:id', (req, res) => {
  const libro = libros.find(l => l.id === parseInt(req.params.id));
  if (!libro) return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  const { nombre, autor } = req.body;
  if (nombre !== undefined) libro.nombre = nombre;
  if (autor !== undefined) libro.autor = autor;
  res.json(libro);
});

// DELETE eliminar
app.delete('/api/recursos/:id', (req, res) => {
  const indice = libros.findIndex(l => l.id === parseInt(req.params.id));
  if (indice === -1) return res.status(404).json({ mensaje: 'Recurso no encontrado' });
  libros.splice(indice, 1);
  res.json({ mensaje: 'Recurso eliminado correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
