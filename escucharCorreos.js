/**
 * Módulo de escucha y procesamiento de correos electrónicos
 * Gestiona la conexión IMAP, monitorea la bandeja de entrada,
 * procesa los correos entrantes y maneja los archivos adjuntos.
 * Incluye sistema de registro de actividades y manejo de errores.
 */

// Importaciones necesarias para el funcionamiento del módulo
import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import dotenv from 'dotenv';
dotenv.config();

// Creación de un archivo de registro para el procesamiento de correos
const logFile = createWriteStream('email_processing.log', { flags: 'a' });

// Función para registrar mensajes con marca de tiempo
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
  logFile.write(logMessage + '\n');
}

// Configuración de la conexión IMAP usando variables de entorno
const config = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT, 10), // Asegurarse de que el puerto sea un número
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false, // Mantener o ajustar según la configuración del servidor
    // minVersion: 'TLSv1.2' // Descomentar si es necesario para el servidor
  }
};

// Función asíncrona para establecer conexión con el servidor IMAP
async function connectImap() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    imap.connect();
  });
}

// Función asíncrona para abrir el buzón de entrada
async function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

// Función asíncrona para obtener los adjuntos de los correos
async function fetchAttachments(imap, results) {
  return new Promise((resolve, reject) => {
    // Iniciar la búsqueda de mensajes
    const f = imap.fetch(results, { bodies: ['HEADER', 'TEXT'], struct: true });
    const attachmentPromises = [];

    f.on('message', (msg) => {
      let subject;
      let from;
      let uid;
      
      // Procesar el encabezado del mensaje para obtener el asunto y el remitente
      msg.on('body', (stream, info) => {
        if (info.which === 'HEADER') {
          // Utilizar simpleParser para analizar el encabezado
          simpleParser(stream)
            .then(parsed => {
              subject = parsed.subject;
              from = parsed.from.text;
              console.log(`📧 Email recibido - Asunto: ${subject}, Remitente: ${from}`);
            })
            .catch(err => {
              console.error('❌ Error al analizar el encabezado:', err);
            });
        }
      });

      // Procesar los atributos del mensaje para encontrar adjuntos
      msg.once('attributes', async (attrs) => {
        // Buscar partes del mensaje que sean adjuntos
        const attachmentParts = findAttachmentParts(attrs.struct);
        log(`Found ${attachmentParts.length} attachments`);
        uid = attrs.uid;

        for (const attachment of attachmentParts) {
          const attachmentPromise = new Promise((resolveAttachment) => {
            const filename = attachment.params.name;
            const encoding = attachment.encoding;

            log(`Processing attachment: ${filename}`);

            // Obtener el contenido del adjunto
            const attachmentFetch = imap.fetch(attrs.uid, { bodies: [attachment.partID] });

            attachmentFetch.on('message', (attachmentMsg) => {
              attachmentMsg.on('body', (stream) => {
                let buffer = Buffer.alloc(0);
                // Acumular los datos del stream en un buffer
                stream.on('data', (chunk) => {
                  buffer = Buffer.concat([buffer, chunk]);
                });

                stream.once('end', async () => {
                  buffer = Buffer.from(buffer.toString(), 'base64');
                  log(`Attachment ${filename} downloaded`);
                  log(`Attachment size: ${buffer.length} bytes`);
                  
                  // Verificar el tipo de archivo
                  const fileType = await fileTypeFromBuffer(buffer);
                  log(`Detected file type: ${fileType ? fileType.mime : 'Unknown'}`);

                  resolveAttachment({ 
                    filename, 
                    content: buffer, 
                    subject, 
                    from,
                    uid: attrs.uid,
                    contentType: fileType ? fileType.mime : 'application/octet-stream'
                  });
                });
              });
            });
          });

          attachmentPromises.push(attachmentPromise);
        }
      });
    });

    f.once('error', reject);
    f.once('end', () => {
      Promise.all(attachmentPromises).then(resolve);
    });
  });
}

// Función asíncrona para guardar los adjuntos en el sistema de archivos
async function saveAttachments(attachments) {
  const dir = path.join(process.cwd(), 'adjuntos_facturas');
  await fs.mkdir(dir, { recursive: true });

  for (const attachment of attachments) {
    const filePath = path.join(dir, attachment.filename);
    let buffer;

    try {
      await fs.writeFile(filePath, attachment.content);
      log(`Archivo adjunto guardado: ${filePath}`);
      log(`Tamaño del archivo: ${attachment.content.length} bytes`);

      // Verificación mejorada para PDF
      if (attachment.filename.toLowerCase().endsWith('.pdf')) {
        if (attachment.content.length > 5 && attachment.content.slice(0, 5).toString('ascii').match(/%PDF-/)) {
          log(`El archivo ${attachment.filename} parece ser un PDF válido.`);
        } else {
          log(`Advertencia: El archivo ${attachment.filename} no parece ser un PDF válido.`);
        }
      }

      // Registrar el tipo MIME del adjunto
      log(`MIME type del adjunto: ${attachment.contentType || 'No disponible'}`);
    } catch (err) {
      log(`Error al guardar el adjunto ${attachment.filename}: ${err.message}`);
    }
  }
}

// Función asíncrona para marcar un correo como leído
async function markEmailAsRead(imap, uid) {
  return new Promise((resolve, reject) => {
    // Añadir la bandera '\Seen' al mensaje
    imap.addFlags(uid, '\\Seen', (err) => {
      if (err) {
        log(`Error al marcar el correo como leído: ${err}`);
        reject(err);
      } else {
        log(`Correo marcado como leído: ${uid}`);
        resolve();
      }
    });
  });
}

function findAttachmentParts(struct, attachments = []) {
  struct.forEach((item) => {
    if (Array.isArray(item)) {
      // Recursivamente buscar en subestructuras
      findAttachmentParts(item, attachments);
    } else if (item.disposition && ['INLINE', 'ATTACHMENT'].includes(item.disposition.type.toUpperCase())) {
      // Añadir el item si es un adjunto
      attachments.push(item);
    }
  });
  return attachments;
}

// Variable para controlar si hay un procesamiento en curso
let isProcessing = false;
// Cola de correos pendientes
let emailQueue = [];

// Función para procesar la cola de correos
async function processQueue(imap, callbackProcesamiento) {
  if (isProcessing || emailQueue.length === 0) {
    return;
  }

  isProcessing = true;
  log('Iniciando procesamiento de cola');

  try {
    while (emailQueue.length > 0) {
      const currentBatch = emailQueue.shift();
      await processNewEmails(imap, callbackProcesamiento, currentBatch);
    }
  } catch (error) {
    console.error('❌ Error procesando la cola:', error);
  } finally {
    isProcessing = false;
    log('Procesamiento de cola completado');
    
    // Verificar si llegaron nuevos correos mientras procesábamos
    if (emailQueue.length > 0) {
      processQueue(imap, callbackProcesamiento);
    }
  }
}

// Función exportada para escuchar nuevos correos
export async function escucharNuevosCorreos(callbackProcesamiento) {
  log('Iniciando escucha de nuevos correos');
  
  const imap = new Imap(config);

  imap.once('ready', async () => {
    try {
      // Abrir el buzón de entrada
      const box = await openInbox(imap);
      log('Buzón abierto, escuchando nuevos mensajes');

      // Buscar correos no leídos al inicio
      const results = await new Promise((resolve, reject) => {
        imap.search(['UNSEEN'], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (results.length > 0) {
        emailQueue.push(results);
        processQueue(imap, callbackProcesamiento);
      }

      // Escuchar evento de nuevo correo
      imap.on('mail', async () => {
        log('Nuevo correo detectado');
        try {
          const newResults = await new Promise((resolve, reject) => {
            imap.search(['UNSEEN'], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          if (newResults.length > 0) {
            emailQueue.push(newResults);
            processQueue(imap, callbackProcesamiento);
          }
        } catch (err) {
          console.error('❌ Error al buscar nuevos correos:', err);
        }
      });
    } catch (err) {
      log(`Error al iniciar la escucha de correos: ${err}`);
    }
  });

  imap.once('error', (err) => {
    log(`Error de conexión IMAP: ${err}`);
  });

  imap.once('end', () => {
    log('Conexión IMAP terminada');
  });

  // Iniciar la conexión IMAP
  imap.connect();
}

// Función asíncrona para procesar nuevos correos
async function processNewEmails(imap, callbackProcesamiento, results) {
  try {
    log(`Procesando lote de ${results.length} correos`);

    // Marcar los correos como leídos inmediatamente
    for (const uid of results) {
      try {
        await markEmailAsRead(imap, uid);
      } catch (markError) {
        console.error(`❌ Error al marcar el correo ${uid} como leído:`, markError);
      }
    }

    // Obtener y procesar los adjuntos
    const attachments = await fetchAttachments(imap, results);
    await saveAttachments(attachments);

    // Procesar cada adjunto secuencialmente
    for (const attachment of attachments) {
      const filePath = path.join(process.cwd(), 'adjuntos_facturas', attachment.filename);
      const ordenCompra = attachment.subject ? obtenerOrdenCompraDelAsunto(attachment.subject) : null;
      
      try {
        console.log(`🟢 Procesando factura con remitente: ${attachment.from}`);
        await callbackProcesamiento(filePath, ordenCompra, attachment.from);
        console.log('✅ Procesamiento completado');
      } catch (fileError) {
        console.error('❌ Error en el procesamiento:', fileError);
        // No propagar el error para que no detenga el procesamiento de otros adjuntos
      }
    }

  } catch (error) {
    console.error('❌ Error al procesar correos:', error);
  }
}

// Función para obtener el número de orden de compra del asunto del correo
function obtenerOrdenCompraDelAsunto(asunto) {
  if (!asunto) {
    log('El asunto del correo está vacío o no definido');
    return null;
  }
  
  // Asegúrate de que asunto sea una cadena
  asunto = String(asunto).trim();
  
  // Si el asunto es solo un número o texto, asumimos que es la orden de compra
  if (asunto.length > 0) {
    log(`Orden de compra encontrada en el asunto: ${asunto}`);
    return asunto;
  } else {
    log('No se encontró un número de orden de compra en el asunto');
    return null;
  }
}
