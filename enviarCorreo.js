/**
 * Módulo de envío de correos electrónicos
 * Gestiona la configuración del servidor SMTP,
 * el envío de correos de respuesta y notificaciones,
 * y el manejo de archivos adjuntos.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type'; // Importación corregida
import { promises as fsPromises } from 'fs';

dotenv.config();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.IMAP_HOST.replace('mail.', 'mail.'),
  port: process.env.SMTP_PORT || '587',
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  auth: {
    user: process.env.IMAP_USER,
    pass: process.env.IMAP_PASSWORD
  }
});

async function verificarConfiguracionSMTP() {
  try {
    console.log('Verificando configuración SMTP con credenciales:', {
      host: process.env.IMAP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.IMAP_USER,
    });
    
    await transporter.verify();
    console.log('✅ Servidor SMTP listo para enviar correos');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración SMTP:', error);
    return false;
  }
}

// Verificar al iniciar la aplicación
// verificarConfiguracionSMTP();

// Función para enviar correo de respuesta
export async function enviarCorreoRespuesta(destinatario, exito, error = null, proveedorMail, rutaArchivo) {
  console.log(`📧 Iniciando envío de correo:
    - Destinatario: ${destinatario}
    - Estado: ${exito ? 'Éxito' : 'Error'}
    - Error: ${error || 'N/A'}`);

  try {
    // Validación del destinatario
    if (!destinatario) {
      console.error('❌ Error: No se proporcionó dirección de correo destino');
      return false;
    }

    const asunto = exito ? 
      '✅ Factura procesada exitosamente' : 
      '❌ Error en el procesamiento de factura';

    const mensaje = exito ?
      `La factura del proveedor ${proveedorMail} ha sido procesada e insertada correctamente en el sistema.` :
      `Se produjo un error al procesar la factura del proveedor ${proveedorMail}: ${error}`;

    console.log('Preparando envío con los siguientes datos:');
    console.log('- From:', process.env.IMAP_USER);
    console.log('- To:', destinatario);
    console.log('- Subject:', asunto);
    const archivoAdjunto = await fs.readFile(rutaArchivo);
    const nombreArchivo = path.basename(rutaArchivo);
    const tipoArchivo = await fileTypeFromBuffer(archivoAdjunto); // Uso corregido
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    const logoUrl = 'https://placehold.co/100x50'; // Reemplaza con la URL de tu logo o una imagen base64

    const htmlCorreo = `
      <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="width: 80%; max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="Logo de la Empresa" style="max-width: 100px;">
          </div>
          <h2 style="color: ${exito ? '#28a745' : '#dc3545'};">${asunto}</h2>
          ${error ? `<p style="color: #dc3545; font-size: 14px; font-weight: bold;">Error: ${error}</p>` : ''}
          <p>Proveedor: ${proveedorMail}</p>
          <p>Fecha: ${fecha}</p>
          <p>Hora: ${hora}</p>
          <a href="https://solinntec.com/#contact" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Contactar Soporte</a>
          <div style="margin-top: 20px; text-align: center; color: #888; font-size: 0.9em;">
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        </div>
      </div>
    `;

    const resultado = await transporter.sendMail({
      from: process.env.IMAP_USER,
      to: destinatario,
      subject: asunto,
      html: htmlCorreo,
      attachments: [{
        filename: nombreArchivo,
        content: archivoAdjunto,
        contentType: tipoArchivo ? tipoArchivo.mime : 'application/octet-stream'
      }]
    });

    console.log('✅ Resultado del envío:', resultado);
    console.log(`✅ Correo enviado exitosamente a ${destinatario}. ID: ${resultado.messageId}`);
    await fsPromises.unlink(rutaArchivo);
    return true;

  } catch (error) {
    console.error('❌ Error detallado al enviar correo:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    throw error; // Propagamos el error para mejor manejo
  }
}

// Función de prueba
async function probarEnvioCorreo() {
  try {
    console.log('🟢 Iniciando prueba de envío de correo...');
    const resultado = await enviarCorreoRespuesta(
      'alangerscho@gmail.com', // Reemplaza con un correo de prueba
      true,
      null,
      'Proveedor de Prueba',
      'factura1.webp' // Reemplaza con la ruta a un archivo de prueba
    );
    console.log('Resultado de la prueba:', resultado);
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Ejecutar la prueba después de verificar la configuración
if (await verificarConfiguracionSMTP()) {
  await probarEnvioCorreo();
}
