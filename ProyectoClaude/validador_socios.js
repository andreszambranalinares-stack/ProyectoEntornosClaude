/**
 * ============================================================
 *  validador_socios.js
 *  Validador de correos electrónicos para socios del Ateneo
 *  Usa únicamente módulos nativos de Node.js (fs, path)
 * ============================================================
 */

// ─── Importación de módulos nativos ──────────────────────────
const fs   = require('fs');
const path = require('path');

// ─── Rutas de los archivos ────────────────────────────────────
const INPUT_FILE    = path.join(__dirname, 'socios.csv');
const VALID_FILE    = path.join(__dirname, 'emails_validos.csv');
const INVALID_FILE  = path.join(__dirname, 'emails_invalidos.csv');

// ─── Expresión regular robusta para validar emails ────────────
/**
 * Reglas que debe cumplir el email:
 *  - Sin espacios en ninguna parte
 *  - Parte local:  letras, números, puntos, guiones, guiones bajos y signos +
 *  - Arroba exactamente 1 vez
 *  - Dominio con al menos un punto
 *  - Extensión (TLD) de entre 2 y 6 caracteres alfabéticos
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/;

/**
 * Valida un correo electrónico contra la expresión regular.
 * @param {string} email - Cadena de texto a validar.
 * @returns {boolean} true si el email es válido, false en caso contrario.
 */
function esEmailValido(email) {
  // Comprobación adicional: no puede haber espacios en ninguna posición
  if (/\s/.test(email)) return false;

  // El dominio debe contener al menos un punto (ya cubierto por la regex,
  // pero lo reforzamos comprobando la parte posterior al @)
  const partes = email.split('@');
  if (partes.length !== 2) return false;
  const dominio = partes[1];
  if (!dominio.includes('.')) return false;

  // Validación principal con la regex
  return EMAIL_REGEX.test(email);
}

/**
 * Lee el archivo CSV, valida cada email y escribe los resultados.
 * Todo está envuelto en try/catch para un manejo robusto de errores.
 */
function procesarCSV() {
  try {
    // ── 1. Leer el archivo de entrada ─────────────────────────
    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(`El archivo "${INPUT_FILE}" no existe.`);
    }

    const contenido = fs.readFileSync(INPUT_FILE, 'utf8');

    // ── 2. Parsear las líneas del CSV ─────────────────────────
    const lineas = contenido
      .split(/\r?\n/)       // compatibilidad Windows/Unix
      .map(l => l.trim())   // eliminar espacios al inicio/fin de línea
      .filter(l => l !== ''); // eliminar líneas vacías

    if (lineas.length === 0) {
      throw new Error('El archivo CSV está vacío.');
    }

    // Extraer la cabecera y localizar la columna "email"
    const cabecera = lineas[0].split(',').map(c => c.trim().toLowerCase());
    const indiceEmail = cabecera.indexOf('email');

    if (indiceEmail === -1) {
      throw new Error('El CSV no contiene una columna llamada "email".');
    }

    // ── 3. Separar correos en válidos e inválidos ─────────────
    const validEmails   = [];
    const invalidEmails = [];

    // Usamos slice(1) para saltar la cabecera y procesar solo filas de datos.
    // Accedemos al email mediante el índice dinámico indiceEmail.
    lineas.slice(1).forEach(linea => {
      const columnas = linea.split(',');
      const emailTrimmed = (columnas[indiceEmail] || '').trim();

      if (emailTrimmed === '') return; // omitir celdas vacías

      if (esEmailValido(emailTrimmed)) {
        validEmails.push(emailTrimmed);
      } else {
        invalidEmails.push(emailTrimmed);
      }
    });

    // ── 4. Exportar resultados a CSV ──────────────────────────
    // Construimos el contenido de cada CSV con cabecera
    const csvValidos   = 'email\n' + validEmails.join('\n');
    const csvInvalidos = 'email\n' + invalidEmails.join('\n');

    fs.writeFileSync(VALID_FILE,   csvValidos,   'utf8');
    fs.writeFileSync(INVALID_FILE, csvInvalidos, 'utf8');

    // ── 5. Mostrar resumen por consola ────────────────────────
    const total = validEmails.length + invalidEmails.length;

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   VALIDADOR DE SOCIOS — ATENEO           ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Total procesados : ${String(total).padEnd(20)}║`);
    console.log(`║  ✅ Válidos        : ${String(validEmails.length).padEnd(20)}║`);
    console.log(`║  ❌ Inválidos      : ${String(invalidEmails.length).padEnd(20)}║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Guardado en:                            ║`);
    console.log(`║  → emails_validos.csv                    ║`);
    console.log(`║  → emails_invalidos.csv                  ║`);
    console.log('╚══════════════════════════════════════════╝\n');

    // Detalle de cada categoría
    if (validEmails.length > 0) {
      console.log('✅ CORREOS VÁLIDOS:');
      validEmails.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    }

    if (invalidEmails.length > 0) {
      console.log('\n❌ CORREOS INVÁLIDOS:');
      invalidEmails.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    }

    console.log('\n✔  Proceso completado con éxito.\n');

  } catch (error) {
    // ── 6. Manejo de errores ──────────────────────────────────
    console.error('\n⛔  ERROR durante el procesamiento:');
    console.error(`   ${error.message}\n`);
    process.exit(1); // Salida con código de error
  }
}

// ─── Punto de entrada ─────────────────────────────────────────
procesarCSV();
