import { escucharNuevosCorreos } from './escucharCorreos.js';
import { procesarFactura } from './procesarFactura.js';

console.log('Iniciando el servidor...');

escucharNuevosCorreos(async (rutaArchivo, ordenCompra, emailRemitente) => {
  console.log(`🟢 Iniciando procesamiento:
    - Archivo: ${rutaArchivo}
    - Orden: ${ordenCompra}
    - Remitente: ${emailRemitente}`);
  
  try {
    const resultado = await procesarFactura(rutaArchivo, ordenCompra, emailRemitente);
    console.log(`✅ Factura procesada: ${resultado.success ? 'Éxito' : 'Error'}`);
  } catch (error) {
    console.error(`❌ Error al procesar la factura ${rutaArchivo}:`, error);
  }
});

console.log('Servidor iniciado. Escuchando nuevos correos...');