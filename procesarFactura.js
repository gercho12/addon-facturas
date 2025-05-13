/**
 * Módulo principal para el procesamiento de facturas
 * Maneja la conversión de imágenes, el procesamiento con IA,
 * la validación de datos y la comunicación con otros módulos del sistema.
 * Integra servicios de IA de Google y realiza validaciones AFIP.
 */

// Importación de módulos necesarios
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from 'fs/promises';
import path from "path";
import sharp from "sharp";
import https from "https";
import natural from "natural";
import { fileTypeFromBuffer } from 'file-type';
import { promises as fsPromises } from 'fs';
import { enviarCorreoRespuesta } from './enviarCorreo.js';
// const { verificarFactura } = require('./validarFactura');
import { verificarFactura } from './validarFactura.js';
import { procesarFacturaAi } from './procesamientoAi.js';
import { verificarTotalFacturas, obtenerDocEntryDeOrdenCompra, matchPurchaseOrderItems } from './funcionesOC.js';

// Configuración de variables de entorno
dotenv.config();

console.log("🟢 Iniciando procesamiento de factura...");

// Inicialización de la API de Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
console.log("API de Google AI inicializada correctamente.");

// Configuración del agente HTTPS para ignorar errores de certificado (no recomendado para producción)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Importación dinámica de node-fetch
const fetch = (await import('node-fetch')).default;

// URL base para el Service Layer de SAP Business One
const serviceLayerUrl = 'https://artico.krimax.net:50100/b1s/v1/';

// Función para iniciar sesión en SAP Business One
async function login() {
  console.log("Iniciando sesión en SAP Business One...");
  // Datos de login
  const loginData = {
    CompanyDB: "08TEST",
    UserName: "manager",
    Password: "Mouse123$"
  };

  try {
    // Envío de solicitud de login
    const response = await fetch(`${serviceLayerUrl}Login`, {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🟢 Inicio de sesión exitoso. ID de sesión:', data.SessionId);
    return data.SessionId;
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    throw error;
  }
}

// Inicialización de herramientas de procesamiento de lenguaje natural
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
console.log("Herramientas de procesamiento de lenguaje natural inicializadas.");


async function makeAuthenticatedRequest(url, method = 'GET', body = null, sessionId) {
  // console.log(`Realizando solicitud autenticada: ${method} ${url}`);
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `B1SESSION=${sessionId}`
  };

  const options = {
    method,
    headers,
    agent: httpsAgent
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error en la solicitud: ${response.status} - ${errorText}`);
    const errorData = JSON.parse(errorText);
    if (errorData && errorData.error && errorData.error.code === -5002 &&
      errorData.error.message && errorData.error.message.value &&
      errorData.error.message.value.includes("folio sequence")) {
    throw new Error("la factura ingresada ya existe, hay una factura registrada con el mismo numero de folio");
  }else{
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);

  }
  }

  console.log("Solicitud completada exitosamente.");
  return response.json();
}


function convertirTasa(tasa) {
  console.log(`Convirtiendo tasa: ${tasa}`);
  if (tasa < 1) {
    return Math.round(tasa * 100);
  }
  return tasa;
}

function formatTaxCode(tasa) {
  console.log(`Formateando código de impuesto para tasa: ${tasa}`);
  console.log(`🟢 Código de impuesto formateado: IVA_${tasa}`);
  return `IVA_${tasa}`;
}


async function optimizeImage(inputPath, outputPath) {
  console.log(`Analizando imagen: ${inputPath}`);
  try {
    let inputBuffer = await fs.readFile(inputPath);
    console.log(`Tamaño del archivo de entrada: ${inputBuffer.length} bytes`);
    
    let fileType;
    try {
      fileType = await fileTypeFromBuffer(inputBuffer);
      if (fileType) {
        console.log(`Formato detectado: ${fileType.ext}`);
        console.log(`MIME type: ${fileType.mime}`);
      } else {
        console.log('No se pudo detectar el formato del archivo, intentando como formato genérico.');
      }
    } catch (error) {
      console.log('Error al detectar el formato del archivo, intentando como formato genérico:', error);
    }

    const newOutputPath = outputPath;
    console.log(`Ruta de salida: ${newOutputPath}`);
    
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    console.log('Metadata de la imagen:', metadata);
    
    // Redimensionamiento condicional
    const maxWidth = 2000;
    const maxHeight = 2000;
    let processedImage = image;
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      console.log(`Redimensionando imagen a un máximo de ${maxWidth}x${maxHeight}`);
      processedImage = image.resize(maxWidth, maxHeight, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      });
    } else {
      console.log('La imagen es lo suficientemente pequeña, no se redimensiona.');
    }

    // Nuevo procesamiento de imagen para mejorar legibilidad de texto
    await processedImage
      .grayscale()
      .modulate({
        brightness: metadata.mean > 128 ? 1.2 : 1.4, // Ajuste dinámico de brillo
        contrast: 1.3 // Aumentar contraste
      })
      .sharpen({ sigma: 1.0, m1: 0, m2: 3 })
      .webp({ quality: 92 }) // Calidad ligeramente reducida para mantener optimización
      .toFile(outputPath);

    console.log(`Imagen optimizada guardada en: ${newOutputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error al analizar o optimizar la imagen:", error);
    throw error;
  }
}


const handleApiError = (error, context) => {
  if (error.response && error.response.data && error.response.data.error) {
    const apiError = error.response.data.error;
    console.error(`Error en ${context}: Código ${apiError.code}, Mensaje: ${apiError.message.value}`);
    throw new Error(`Error al obtener ${context}: ${apiError.message.value}`);
  } else {
    console.error(`Error inesperado en ${context}:`, error);
    throw error;
  }
};

export async function procesarFactura(rutaArchivo, ordenCompra, emailRemitente) {
  const emailCliente = "alangerscho@gmail.com";

  console.log(`🟢 Iniciando procesamiento de factura:
    - Ruta: ${rutaArchivo}
    - Orden: ${ordenCompra}
    - Email: ${emailRemitente}`);

  try {
    if (!rutaArchivo) {
      console.error("Error: No se proporcionó ruta de archivo");
      if (emailCliente) {
        await enviarCorreoRespuesta(emailCliente, false, "No se proporcionó ruta de archivo", emailRemitente, rutaArchivo, cardCode);
      }
      return { success: false, error: "No se proporcionó ruta de archivo" };
    }

    let rutaArchivoPreparado = rutaArchivo;
    let mimeType = null;
    let sessionId;
    let purchaseOrder; // Variable para almacenar la orden de compra

    try {
      console.log("Iniciando sesión en SAP...");
      sessionId = await login();
      console.log("Sesión iniciada exitosamente.");


      // Obtención de la orden de compra completa
      try {
        console.log(`Obteniendo orden de compra número ${ordenCompra}...`);
        const purchaseOrderUrl = `${serviceLayerUrl}PurchaseOrders?$filter=DocNum eq ${ordenCompra}`;
        purchaseOrder = await makeAuthenticatedRequest(purchaseOrderUrl, 'GET', null, sessionId);
        console.log("🟢 Orden de compra obtenida exitosamente.");
        // console.log(purchaseOrder);

      } catch (error) {
        handleApiError(error, 'la orden de compra');
        return { success: false, error: error.message }; // Agregamos un return para salir de la función en caso de error
      }

      // Verificación de existencia de la orden de compra
      if (!purchaseOrder || !purchaseOrder.value || purchaseOrder.value.length === 0) {
        throw new Error(`No se encontró la orden de compra con número ${ordenCompra}`);
      }

      // Obtención de los artículos de la orden de compra
      const poItems = purchaseOrder.value[0].DocumentLines;
      // console.log("Artículos de la orden de compra:", poItems);
      
      // Verificación de existencia de artículos en la orden de compra
      if (!poItems || poItems.length === 0) {
        throw new Error(`La orden de compra ${ordenCompra} no tiene líneas de items`);
      }


      const fileExtension = path.extname(rutaArchivo).toLowerCase();

      if (fileExtension === '.pdf') {
        console.log("Archivo PDF detectado. Procesando directamente...");
        mimeType = 'application/pdf';
        // imagenUsuario = await fileToGenerativePart(rutaArchivo, mimeType);
      } else if (fileExtension === '.webp') {
        console.log("Archivo WebP detectado. Procesando directamente...");
        mimeType = 'image/webp';
        // imagenUsuario = await fileToGenerativePart(rutaArchivo, mimeType);
        await optimizeImage(rutaArchivo, rutaArchivo);
        rutaArchivoPreparado = rutaArchivo;
      } else {
        console.log("Optimizando imagen no WebP...");
        const nombreArchivo = `${path.basename(rutaArchivo, path.extname(rutaArchivo))}.webp`;
        const optimizedImagePath = path.join(path.dirname(rutaArchivo), nombreArchivo);
        await optimizeImage(rutaArchivo, optimizedImagePath);
        rutaArchivoPreparado = optimizedImagePath;
        await fsPromises.unlink(rutaArchivo);
        console.log(`Archivo original eliminado: ${rutaArchivo}`);
      }

        let jsonDataParsed = await procesarFacturaAi(rutaArchivoPreparado, mimeType);
          
          const validacionAFIP = await verificarFactura(jsonDataParsed);
          if (!validacionAFIP.valido) {
            throw new Error(`La factura no es válida para ARCA: ${validacionAFIP.observaciones || 'Sin observaciones'}`);
          }else{
            console.log("La factura es valida para ARCA")
          }

          const cuitEmisor = jsonDataParsed.emisor.CUIT.replace(/[^0-9]/g, '');
          const businessPartnersUrl = `${serviceLayerUrl}BusinessPartners?$filter=FederalTaxID eq '${cuitEmisor}'&$select=CardCode`;
          
          console.log('🟢 Buscando BusinessPartner por CUIT:', cuitEmisor);
    
          const businessPartner = await makeAuthenticatedRequest(businessPartnersUrl, 'GET', null, sessionId);
          console.log('Respuesta de BusinessPartners:', JSON.stringify(businessPartner, null, 2));
    
          if (!businessPartner.value || businessPartner.value.length === 0) {
            console.error('No se encontró BusinessPartner para el CUIT proporcionado');
            throw new Error('No se encontró BusinessPartner para el CUIT proporcionado. El proveedor que emitio la factura, no esta registrado en el sistema.');
          }
    
          const cardCode = businessPartner.value[0].CardCode;
    
          if (!cardCode) {
            console.error('CardCode no definido en la respuesta de BusinessPartner');
            throw new Error('CardCode is undefined in the BusinessPartner response');
          }          
          const tasaConvertida = convertirTasa(jsonDataParsed.impuestos.IVA.tasa);
          const taxCode = formatTaxCode(tasaConvertida);
          try {
            console.log("🟢 Iniciando emparejamiento de ítems de factura con orden de compra...");
            const { matchedItems, unmatchedItems, poTotal } = await matchPurchaseOrderItems(
              jsonDataParsed.items,
              jsonDataParsed.total,
              sessionId,
              ordenCompra,
              purchaseOrder
            );          
            if (unmatchedItems.length > 0) {
              console.warn(`Advertencia: ${unmatchedItems.length} ítems no coincidieron:`, unmatchedItems);
              throw new Error('No se pudieron emparejar todos los ítems. Proceso cancelado.');
            }

            // Verificar el total de facturas antes de continuar
            const totalFacturasVerificado = await verificarTotalFacturas(ordenCompra, jsonDataParsed.total, sessionId);
            if (!totalFacturasVerificado) {
              console.error('El total de facturas excedería el total de la orden de compra. Proceso cancelado.');
              throw new Error('El total de facturas excedería el total de la orden de compra. Proceso cancelado.');
            }

            // Obtener el DocEntry de la orden de compra
            const docEntryOrdenCompra = await obtenerDocEntryDeOrdenCompra(ordenCompra, sessionId);

            console.log("Preparando datos para crear factura de compra en SAP...");
            const purchaseInvoiceData = {
              "CardCode": cardCode,
              "DocDate": jsonDataParsed.fechaEmision,
              "DocDueDate": jsonDataParsed.fechaVencimiento || jsonDataParsed.fechaEmision,
              "DocType": `dDocument_Items`,
              "DocCurrency": jsonDataParsed.divisa == null || jsonDataParsed.divisa === "null" ? "ARS" : jsonDataParsed.divisa,
              "FederalTaxID": jsonDataParsed.emisor.CUIT.replace(/[^0-9]/g, ''),
              "U_B1SYS_CAI": jsonDataParsed.codigoAutorizacion,
              "U_B1SYS_CAI_DATE": jsonDataParsed.fechaCodigoAutorizacion,
              "PointOfIssueCode": jsonDataParsed.codigoFactura.includes('-') ? jsonDataParsed.codigoFactura.split('-')[0].trim() : '0001',
              "FolioNumberFrom": jsonDataParsed.codigoFactura.includes('-') ? jsonDataParsed.codigoFactura.split('-')[1].trim() : jsonDataParsed.codigoFactura,
              "FolioNumberTo": jsonDataParsed.codigoFactura.includes('-') ? jsonDataParsed.codigoFactura.split('-')[1].trim() : jsonDataParsed.codigoFactura,
              "Letter": `fLetter${jsonDataParsed.tipoFactura}`,
              "DocumentLines": matchedItems.map((item, index) => ({
                "LineNum": index,
                "ItemCode": item.ItemCode,
                "Quantity": item.cantidadUnidades,
                "UnitPrice": item.precioUnidad,
                "DiscountPercent": item.bonificacion * 10,
                "LineTotal": item.importeItem,
                "TaxCode": taxCode,
              })),
              "DocumentReferences": [
                {
                    "RefDocEntr": docEntryOrdenCompra,
                    "RefObjType": "rot_PurchaseOrder"
                }
              ]
            };
            console.log(purchaseInvoiceData)
            // Continúa con el proceso de envío a SAP si todos los ítems coincidieron
            if (unmatchedItems.length === 0) {
              console.log("🟢 Enviando factura de compra a SAP...");
              const responseData = await makeAuthenticatedRequest(`${serviceLayerUrl}PurchaseInvoices`, 'POST', purchaseInvoiceData, sessionId);
              // console.log('Respuesta de creación de factura de compra:', JSON.stringify(responseData, null, 2));
            } else {
              console.error('No se pudieron emparejar todos los ítems. Proceso cancelado.');
              throw new Error('No se pudieron emparejar todos los ítems. Proceso cancelado.');
            }
          } catch (error) {
            console.error("Error en el procesamiento de la factura:", error);
            throw error; // Asegura que el error se propague
          }
        

      // Al final del procesamiento exitoso
      if (emailCliente) {
        console.log('📧 Preparando envío de correo a:', emailCliente);
        try {
          const emailEnviado = await enviarCorreoRespuesta(emailCliente, true, null, emailRemitente, rutaArchivo);
          if (!emailEnviado) {
            console.warn(`⚠️ No se pudo enviar el correo a ${emailCliente}`);
          } else {
            console.log('✅ Correo enviado exitosamente');
          }
        } catch (emailError) {
          console.error('❌ Error al enviar correo:', {
            email: emailCliente,
            error: emailError.message
          });
        }
      } else {
        console.warn('⚠️ No se recibió email del remitente');
      }

      return { success: true, data: jsonDataParsed };

    } catch (error) {
      console.error("❌ Error en el procesamiento:", error);
      if (emailCliente) {
        try {
          await enviarCorreoRespuesta(emailCliente, false, error.message, emailRemitente, rutaArchivo);
        } catch (emailError) {
          console.error('❌ Error al enviar correo de error:', emailError);
        }
      }
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('❌ Error general:', error);
    if (emailCliente) {
      try {
        await enviarCorreoRespuesta(emailCliente, false, error.message), emailRemitente, rutaArchivo, cardCode;
      } catch (emailError) {
        console.error('❌ Error al enviar correo de error:', emailError);
      }
    }
    return { success: false, error: error.message };
  }
}
// run("entrenamiento/factura16.webp", 8);

// procesarFactura("C:\Users\AG\Desktop\facturasApi\adjuntos_facturas