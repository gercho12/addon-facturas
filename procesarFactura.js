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
import { verificarFactura } from './validarFactura.js';
import { procesarFacturaAi } from './procesamientoAi.js';
import { verificarTotalFacturas, obtenerDocEntryDeOrdenCompra, matchPurchaseOrderItems, obtenerDatosOrdenCompraSAP, validarYEmparejarItemsConOC } from './funcionesOC.js';

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
export const serviceLayerUrl = 'https://artico.krimax.net:50100/b1s/v1/';

// Función para iniciar sesión en SAP Business One
async function login() {
  console.log("Iniciando sesión en SAP Business One...");
  const loginData = {
    CompanyDB: "08TEST",
    UserName: "manager",
    Password: "Mouse123$"
  };

  try {
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

export async function makeAuthenticatedRequest(url, method = 'GET', body = null, sessionId) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `B1SESSION=${sessionId}`
  };
  const options = { method, headers, agent: httpsAgent };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error en la solicitud: ${response.status} - ${errorText}`);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (parseErr) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    if (errorData && errorData.error && errorData.error.code === -5002 &&
      errorData.error.message && errorData.error.message.value &&
      errorData.error.message.value.includes("folio sequence")) {
      throw new Error("la factura ingresada ya existe, hay una factura registrada con el mismo numero de folio");
    } else {
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
  const formattedTaxCode = `IVA_${tasa}`;
  console.log(`🟢 Código de impuesto formateado: ${formattedTaxCode}`);
  return formattedTaxCode;
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

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    console.log('Metadata de la imagen:', metadata);
    
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

    await processedImage
      .grayscale()
      .modulate({
        brightness: metadata.mean > 128 ? 1.2 : 1.4,
        contrast: 1.3
      })
      .sharpen({ sigma: 1.0, m1: 0, m2: 3 })
      .webp({ quality: 92 })
      .toFile(outputPath);

    console.log(`Imagen optimizada guardada en: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Error al analizar o optimizar la imagen:", error);
    throw error;
  }
}

export const handleApiError = (error, context) => {
  if (error.response && error.response.data && error.response.data.error) {
    const apiError = error.response.data.error;
    console.error(`Error en ${context}: Código ${apiError.code}, Mensaje: ${apiError.message.value}`);
    throw new Error(`Error al obtener ${context}: ${apiError.message.value}`);
  } else {
    console.error(`Error inesperado en ${context}:`, error);
    throw error;
  }
};

// --- NUEVAS FUNCIONES AUXILIARES REFACTORIZADAS ---

async function prepararArchivoFactura(rutaArchivoOriginal) {
  console.log("Preparando archivo de factura...");
  const fileExtension = path.extname(rutaArchivoOriginal).toLowerCase();
  let rutaArchivoPreparado = rutaArchivoOriginal;
  let mimeType = null;

  if (fileExtension === '.pdf') {
    console.log("Archivo PDF detectado. Procesando directamente...");
    mimeType = 'application/pdf';
  } else if (fileExtension === '.webp') {
    console.log("Archivo WebP detectado. Optimizando (si es necesario) y procesando...");
    mimeType = 'image/webp';
    // Aunque sea WebP, una optimización puede ser beneficiosa para consistencia o reducción de tamaño.
    await optimizeImage(rutaArchivoOriginal, rutaArchivoOriginal); 
    rutaArchivoPreparado = rutaArchivoOriginal;
  } else {
    console.log("Optimizando imagen no WebP a WebP...");
    const nombreArchivo = `${path.basename(rutaArchivoOriginal, path.extname(rutaArchivoOriginal))}.webp`;
    const optimizedImagePath = path.join(path.dirname(rutaArchivoOriginal), nombreArchivo);
    await optimizeImage(rutaArchivoOriginal, optimizedImagePath);
    rutaArchivoPreparado = optimizedImagePath;
    mimeType = 'image/webp';
    try {
        await fsPromises.unlink(rutaArchivoOriginal);
        console.log(`Archivo original eliminado: ${rutaArchivoOriginal}`);
    } catch (unlinkError) {
        console.warn(`No se pudo eliminar el archivo original ${rutaArchivoOriginal}: ${unlinkError.message}`);
    }
  }
  console.log(`Archivo preparado: ${rutaArchivoPreparado}, MIME: ${mimeType}`);
  return { rutaArchivoPreparado, mimeType };
}



async function obtenerSocioNegocioSAP(cuitEmisor, sessionId) {
  console.log('🟢 Buscando BusinessPartner por CUIT:', cuitEmisor);
  const businessPartnersUrl = `${serviceLayerUrl}BusinessPartners?$filter=FederalTaxID eq '${cuitEmisor}'&$select=CardCode`;
  try {
    const businessPartner = await makeAuthenticatedRequest(businessPartnersUrl, 'GET', null, sessionId);
    console.log('Respuesta de BusinessPartners:', JSON.stringify(businessPartner, null, 2));

    if (!businessPartner.value || businessPartner.value.length === 0) {
      throw new Error('No se encontró BusinessPartner para el CUIT proporcionado. El proveedor que emitio la factura, no esta registrado en el sistema.');
    }
    const cardCode = businessPartner.value[0].CardCode;
    if (!cardCode) {
      throw new Error('CardCode no definido en la respuesta de BusinessPartner');
    }
    console.log(`CardCode obtenido: ${cardCode}`);
    return cardCode;
  } catch (error) {
     handleApiError(error, `socio de negocio con CUIT ${cuitEmisor}`);
     // throw error; // Similar a obtenerDatosOrdenCompraSAP
  }
}



async function crearFacturaEnSAP(jsonDataParsed, cardCode, sessionId, taxCode, matchedItems, docEntryOrdenCompra) {
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
      "DiscountPercent": item.bonificacion * 10, // Asumiendo que bonificacion es un decimal ej: 0.1 para 10%
      "LineTotal": item.importeItem,
      "TaxCode": taxCode,
    })),
  };

  if (docEntryOrdenCompra) {
    purchaseInvoiceData.DocumentReferences = [
      {
        "RefDocEntr": docEntryOrdenCompra,
        "RefObjType": "rot_PurchaseOrder"
      }
    ];
  }

  console.log("Datos de la factura a enviar a SAP:", JSON.stringify(purchaseInvoiceData, null, 2));

  console.log("🟢 Enviando factura de compra a SAP...");
  try {
    const responseData = await makeAuthenticatedRequest(`${serviceLayerUrl}PurchaseInvoices`, 'POST', purchaseInvoiceData, sessionId);
    console.log('Respuesta de creación de factura de compra:', JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error) {
    console.error("Error en la creación de factura SAP:", error);
    throw error;
  }
}

// --- FUNCIÓN PRINCIPAL ORQUESTADORA ---
export async function procesarFactura(rutaArchivo, ordenCompra, emailRemitente) {
  const emailCliente = "alangerscho@gmail.com";
  let cardCode = null; // Declarar cardCode aquí para que esté disponible en el catch final
  let sessionId = null;

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

    try {
      console.log("Iniciando sesión en SAP...");
      sessionId = await login();
      console.log("Sesión iniciada exitosamente.");

      // 1. Obtener datos de la Orden de Compra de SAP
      const purchaseOrderSAP = await obtenerDatosOrdenCompraSAP(ordenCompra, sessionId);

      // 2. Preparar archivo (optimizar/convertir imagen, determinar MIME type)
      const { rutaArchivoPreparado, mimeType } = await prepararArchivoFactura(rutaArchivo);

      // 3. Procesar factura con IA para extraer datos
      let jsonDataParsed = await procesarFacturaAi(rutaArchivoPreparado, mimeType);
          
      // 4. Validar factura con AFIP
      const validacionAFIP = await verificarFactura(jsonDataParsed);
      if (!validacionAFIP.valido) {
        throw new Error(`La factura no es válida para ARCA: ${validacionAFIP.observaciones || 'Sin observaciones'}`);
      }
      console.log("La factura es valida para ARCA");

      // 5. Obtener Socio de Negocio (Proveedor) de SAP
      const cuitEmisor = jsonDataParsed.emisor.CUIT.replace(/[^0-9]/g, '');
      cardCode = await obtenerSocioNegocioSAP(cuitEmisor, sessionId);
          
      // 6. Preparar código de impuesto
      const tasaConvertida = convertirTasa(jsonDataParsed.impuestos.IVA.tasa);
      const taxCode = formatTaxCode(tasaConvertida);

      // 7. Validar y emparejar ítems con OC (si aplica)
      let matchedItemsSap;
      let docEntryOC = null;

      if (ordenCompra && ordenCompra !== "null" && ordenCompra !== "undefined") {
        console.log(`Procesando con Orden de Compra: ${ordenCompra}`);
        const { matchedItems, docEntryOrdenCompra } = await validarYEmparejarItemsConOC(jsonDataParsed, sessionId, ordenCompra, purchaseOrderSAP);
        matchedItemsSap = matchedItems; // Usar los ítems emparejados con la OC
        docEntryOC = docEntryOrdenCompra;
      } else {
        console.log("Procesando sin Orden de Compra específica o datos de OC no válidos.");
        // Para facturas sin OC, los ítems de jsonDataParsed se usan directamente
        // Se necesita mapear jsonDataParsed.items al formato esperado por crearFacturaEnSAP si es diferente
        // Por ahora, asumimos que jsonDataParsed.items ya tiene la estructura necesaria o se adaptará en crearFacturaEnSAP
        // Si se requiere un mapeo específico para items sin OC, se debe añadir aquí.
        matchedItemsSap = jsonDataParsed.items.map(item => ({
            // Aquí se necesitaría mapear los campos de jsonDataParsed.items
            // a los campos esperados por DocumentLines (ItemCode, cantidadUnidades, precioUnidad, etc.)
            // Esto es un placeholder y DEBE SER AJUSTADO según la estructura real de jsonDataParsed.items
            ItemCode: item.codigo, // Ejemplo, ajustar según el nombre real del campo
            Quantity: item.cantidad,
            UnitPrice: item.precioUnitario,
            DiscountPercent: (item.descuento || 0) * 100, // Asumiendo que descuento es un decimal ej: 0.1 para 10%
            LineTotal: item.total, // Ejemplo
            // TaxCode se pasa a crearFacturaEnSAP y se aplica a todas las líneas
        }));
        // Validar que los campos necesarios existan en jsonDataParsed.items
        if (matchedItemsSap.some(item => item.ItemCode === undefined || item.Quantity === undefined || item.UnitPrice === undefined)) {
            throw new Error("Los ítems de la factura (sin OC) no tienen la estructura esperada. Se requiere ItemCode, Quantity, UnitPrice.");
        }
      }

      // 8. Crear factura en SAP
      await crearFacturaEnSAP(jsonDataParsed, cardCode, sessionId, taxCode, matchedItemsSap, docEntryOC);
        
      // 9. Envío de correo de éxito
        
      // 8. Envío de correo de éxito
      if (emailCliente) {
        console.log('📧 Preparando envío de correo a:', emailCliente);
        try {
          const emailEnviado = await enviarCorreoRespuesta(emailCliente, true, null, emailRemitente, rutaArchivoPreparado, cardCode);
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
      console.error("❌ Error en el procesamiento principal de la factura:", error);
      if (emailCliente) {
        try {
          await enviarCorreoRespuesta(emailCliente, false, error.message, emailRemitente, rutaArchivo, cardCode);
        } catch (emailError) {
          console.error('❌ Error al enviar correo de error:', emailError);
        }
      }
      return { success: false, error: error.message };
    }
  } catch (error) { // Catch para errores muy tempranos, como la validación de rutaArchivo
    console.error('❌ Error general (antes de iniciar sesión SAP):', error);
    if (emailCliente) {
      try {
        await enviarCorreoRespuesta(emailCliente, false, error.message, emailRemitente, rutaArchivo, cardCode); // cardCode será null aquí
      } catch (emailError) {
        console.error('❌ Error al enviar correo de error general:', emailError);
      }
    }
    return { success: false, error: error.message };
  }
}

// Ejemplo de uso (comentado)
// procesarFactura("C:\\Users\\AG\\Desktop\\facturasApi\\adjuntos_facturas\\factura16.webp", 8, "alangerscho@gmail.com");
