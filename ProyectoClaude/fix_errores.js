/**
 * ============================================================
 *  fix_errores.js
 *  Corrige los errores introducidos intencionalmente en:
 *    - validador_socios.js
 *    - validador_socios.html
 * ============================================================
 */

const fs   = require('fs');
const path = require('path');

let totalFixes = 0;

function patchFile(filePath, patches) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  patches.forEach(({ description, from, to }) => {
    if (content.includes(from)) {
      content = content.replace(from, to);
      console.log(`  ✔ ${description}`);
      totalFixes++;
    } else {
      console.warn(`  ⚠ No se encontró el fragmento para: "${description}"`);
    }
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  → Archivo guardado: ${path.basename(filePath)}\n`);
  } else {
    console.log(`  → Sin cambios en: ${path.basename(filePath)}\n`);
  }
}

// ─────────────────────────────────────────────────────────────
//  1. Corregir validador_socios.js
// ─────────────────────────────────────────────────────────────
console.log('📄 Corrigiendo validador_socios.js…');

patchFile(path.join(__dirname, 'validador_socios.js'), [
  {
    description: 'slice(0) → slice(1)  [saltar cabecera del CSV]',
    from: `    // Usamos slice(0) para procesar todas las líneas incluyendo el header.\n    // El destructuring extrae directamente las 3 columnas del CSV.\n    lineas.slice(0).forEach(linea => {\n      const [nombre, email, telefono] = linea.split(',');\n      const emailTrimmed = (email || '').trim();`,
    to:   `    // Usamos slice(1) para saltar la cabecera y procesar solo filas de datos.\n    // Accedemos al email mediante el índice dinámico indiceEmail.\n    lineas.slice(1).forEach(linea => {\n      const columnas = linea.split(',');\n      const emailTrimmed = (columnas[indiceEmail] || '').trim();`
  }
]);

// ─────────────────────────────────────────────────────────────
//  2. Corregir validador_socios.html
// ─────────────────────────────────────────────────────────────
console.log('📄 Corrigiendo validador_socios.html…');

patchFile(path.join(__dirname, 'validador_socios.html'), [
  {
    description: 'Eliminar alert() del CSV vacío',
    from: `      alert('❌ Error: El archivo CSV está vacío.');\n      log('⚠ El CSV está vacío.', 'log-err');`,
    to:   `      log('⚠ El CSV está vacío.', 'log-err');`
  },
  {
    description: 'Restaurar detección dinámica de columna email + slice(1)',
    from: `    // Extraer emails usando destructuring fijo de 3 columnas (nombre, email, telefono)
    // y slice(0) para procesar todas las líneas incluyendo el header.
    const emails = lineas.slice(0)
      .map(linea => {
        const [nombre, email, telefono] = linea.split(',');
        return (email || '').trim();
      })
      .filter(e => e !== '');

    // Bug: slice(0) incluye el header → la palabra "email" entra en el array.
    // Lo detectamos y lanzamos un alert de error.
    if (emails.includes('email')) {
      alert('❌ Error de parseo: se ha detectado la cabecera del CSV como dato.\\n\\nCausa: slice(0) no salta el header y el destructuring fijo extrae "email" como valor válido.\\n\\nRevisa el código de validador_socios.js.');
      log('⚠ Error: cabecera procesada como dato (slice(0) + destructuring fijo).', 'log-err');
      return;
    }

    if (emails.length === 0) {
      alert('❌ Error: No se encontraron emails en el CSV.\\n\\nComprueba que el archivo tiene el formato correcto: nombre,email,telefono');
      log('⚠ No se encontraron emails en el CSV.', 'log-err');
      return;
    }`,
    to:   `    // Detectar columna email de forma dinámica
    const cabecera = lineas[0].split(',').map(c => c.trim().toLowerCase());
    const idx = cabecera.indexOf('email');

    let emails;
    if (idx !== -1) {
      // Tiene cabecera → extraer columna email de las filas de datos
      emails = lineas.slice(1)
        .map(l => (l.split(',')[idx] || '').trim())
        .filter(e => e !== '');
    } else {
      // Sin cabecera reconocida → asumir que cada línea ES un email
      emails = lineas.map(l => l.trim()).filter(e => e !== '');
    }

    if (emails.length === 0) {
      log('⚠ No se encontraron emails en el CSV.', 'log-err');
      return;
    }`
  }
]);

// ─────────────────────────────────────────────────────────────
//  Resumen
// ─────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════╗');
console.log('║   FIX ERRORES — RESUMEN                  ║');
console.log('╠══════════════════════════════════════════╣');
console.log(`║  Correcciones aplicadas: ${String(totalFixes).padEnd(16)}║`);
console.log('╚══════════════════════════════════════════╝');
