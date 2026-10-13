// URL de tu API local (Práctica 2.3)
const API_URL = 'http://localhost:3000/api/recursos';

const estado = document.getElementById('estado');
const contenedorTabla = document.getElementById('tabla-datos');
const selectorTipo = document.getElementById('tipoGrafica');
const tituloGrafica = document.getElementById('titulo-grafica');

let grafica = null;      // instancia actual de Chart.js
let datosGrafica = null; // { etiquetas, valores, titulo }

// ---------- Parte III: consumo de datos con fetch() ----------
async function cargarDatos() {
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      throw new Error(`La API respondió con estado ${respuesta.status}`);
    }
    const libros = await respuesta.json();

    if (libros.length === 0) {
      estado.textContent = 'La API no devolvió registros.';
      return;
    }

    estado.style.display = 'none';
    pintarTabla(libros);
    datosGrafica = prepararDatosGrafica(libros);
    dibujarGrafica(selectorTipo.value);
  } catch (error) {
    console.error(error);
    estado.classList.add('error');
    estado.textContent =
      'No se pudieron cargar los datos. Verifica que el servidor Node.js ' +
      'y la base de datos estén corriendo y que CORS esté habilitado. ' +
      `(${error.message})`;
  }
}

// Genera la tabla HTML e inyecta las filas en el DOM
function pintarTabla(libros) {
  const tabla = document.createElement('table');
  const tieneNumerico = libros.some(l => l.paginas != null);

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>ID</th><th>Nombre</th><th>Autor</th>
        ${tieneNumerico ? '<th>Páginas</th>' : ''}
      </tr>
    </thead>
    <tbody></tbody>`;

  const tbody = tabla.querySelector('tbody');
  libros.forEach(libro => {
    const fila = document.createElement('tr');
    // textContent evita inyectar HTML proveniente de la base de datos
    const celdas = [libro.id, libro.nombre, libro.autor];
    if (tieneNumerico) celdas.push(libro.paginas ?? '—');
    celdas.forEach(valor => {
      const td = document.createElement('td');
      td.textContent = valor;
      fila.appendChild(td);
    });
    tbody.appendChild(fila);
  });

  contenedorTabla.innerHTML = '';
  contenedorTabla.appendChild(tabla);
}

// ---------- Parte IV: preparar arreglos para la gráfica ----------
function prepararDatosGrafica(libros) {
  // Caso 1: la tabla tiene una columna numérica "paginas" -> páginas por libro
  if (libros.some(l => l.paginas != null)) {
    const filtrados = libros.filter(l => l.paginas != null);
    return {
      etiquetas: filtrados.map(l => l.nombre),
      valores: filtrados.map(l => Number(l.paginas)),
      titulo: 'Número de páginas por libro'
    };
  }

  // Caso 2: solo hay id, nombre y autor -> cantidad de libros por autor
  const conteo = {};
  libros.forEach(l => { conteo[l.autor] = (conteo[l.autor] || 0) + 1; });
  return {
    etiquetas: Object.keys(conteo),
    valores: Object.values(conteo),
    titulo: 'Cantidad de libros por autor'
  };
}

function dibujarGrafica(tipo) {
  if (!datosGrafica) return;
  if (grafica) grafica.destroy(); // evita gráficas encimadas al cambiar de tipo

  tituloGrafica.textContent = datosGrafica.titulo;

  const colores = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4',
    '#a855f7', '#ec4899', '#84cc16', '#14b8a6', '#f97316'
  ];
  const fondo = datosGrafica.etiquetas.map((_, i) => colores[i % colores.length]);

  const ctx = document.getElementById('miGrafica').getContext('2d');
  grafica = new Chart(ctx, {
    type: tipo, // 'bar' o 'pie'
    data: {
      labels: datosGrafica.etiquetas,
      datasets: [{
        label: datosGrafica.titulo,
        data: datosGrafica.valores,
        backgroundColor: fondo,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: tipo === 'pie' }
      },
      scales: tipo === 'bar'
        ? { y: { beginAtZero: true, ticks: { precision: 0 } } }
        : {}
    }
  });
}

selectorTipo.addEventListener('change', () => dibujarGrafica(selectorTipo.value));

cargarDatos();