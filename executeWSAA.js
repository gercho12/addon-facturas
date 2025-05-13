/**
 * Módulo de autenticación con AFIP (WSAA)
 * Gestiona la ejecución de scripts PowerShell para autenticación,
 * maneja certificados digitales y procesa respuestas XML del servicio.
 * Proporciona funciones para obtener tokens y firmas necesarias para las operaciones con AFIP.
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import { parseStringPromise } from 'xml2js';
import path from 'path';

// Ruta del script de PowerShell y archivos relacionados
const ubicacionWSAA = 'c:\\Users\\alang\\OneDrive\\Escritorio\\addon-facturas\\wsaa';
const scriptPath = path.join(ubicacionWSAA, 'wsaa-cliente.ps1');
const certPath = path.join(ubicacionWSAA, 'CERTSOL.pfx');
const responseXmlPath = path.join(ubicacionWSAA, 'response-log.xml');

// Función para ejecutar el script de PowerShell
export async function executeWSAAScript() {
  return new Promise((resolve, reject) => {
    const command = `powershell -ExecutionPolicy Bypass -File ${scriptPath} -Certificado ${certPath} -Password "PENDE24" -ServicioId "wscdc"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando el script: ${stderr}`);
        return reject(error);
      }
      console.log(`Script ejecutado correctamente: ${stdout}`);
      resolve();
    });
  });
}

// Función para leer y parsear el archivo XML de respuesta
export async function parseResponseXml() {
  try {
    const xmlData = await fs.readFile(responseXmlPath, 'utf-8');
    console.log('Contenido del archivo XML:', xmlData.slice(0, 100)); // Mostrar los primeros 100 caracteres
    if (xmlData.trim().length === 0) {
      throw new Error('El archivo XML está vacío.');
    }
    const cleanedXmlData = xmlData.replace(/[^\x20-\x7E\x0A\x0D]/g, ''); // Eliminar caracteres no válidos
    const result = await parseStringPromise(cleanedXmlData);
    const token = result['loginTicketResponse']['credentials'][0]['token'][0];
    const sign = result['loginTicketResponse']['credentials'][0]['sign'][0];
    return { token, sign };
  } catch (error) {
    console.error('Error leyendo o parseando el archivo XML:', error);
    throw error;
  }
}

