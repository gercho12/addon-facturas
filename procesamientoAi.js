/**
 * Módulo de procesamiento de facturas con IA
 * Utiliza Google Generative AI para analizar y extraer información de facturas,
 * implementa sistema de logging avanzado y manejo de similitud de textos,
 * y proporciona funciones de utilidad para el procesamiento de documentos.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { facturas, systemInstruction } from "./contexto.js";
import { verificarFactura } from './validarFactura.js';

// Importar las nuevas dependencias para extracción de texto
// Asegúrate de instalarlas: npm install pdf-parse tesseract.js
import pdf from 'pdf-parse'; // Para extraer texto de PDFs
import Tesseract from 'tesseract.js'; // Para extraer texto de imágenes (OCR)

// Configuración de variables de entorno
dotenv.config();

// Inicialización de la API de Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Reemplaza con tu API Key si es necesario, o usa process.env.GOOGLE_API_KEY

// Configuración de logging
const LOG_LEVEL = {
    ERROR: 0,   // Siempre mostrar
    WARN: 1,    // Siempre mostrar
    INFO: 2,    // Mostrar por defecto
    DEBUG: 3    // Solo mostrar si se solicita
};
let currentLogLevel = LOG_LEVEL.INFO;
// Colores para el logging
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m"
}

function log(level, text, details = null) {
    if (level > currentLogLevel) return;

    switch (level) {
        case LOG_LEVEL.ERROR:
            console.log(colors.red + "✗ " + text + colors.reset);
            break;
        case LOG_LEVEL.WARN:
            console.log(colors.yellow + "! " + text + colors.reset);
            break;
        case LOG_LEVEL.INFO:
            console.log(colors.white + "• " + text + colors.reset);
            break;
        case LOG_LEVEL.DEBUG:
            console.log(colors.dim + "  " + text + colors.reset);
            if (details) {
                console.log(colors.dim + "    " + details + colors.reset);
            }
            break;
    }
}

function printHeader(text) {
    console.log("\n" + colors.blue + "=== " + text + " ===" + colors.reset + "\n");
}

function printSubHeader(text) {
    console.log(colors.cyan + "--- " + text + " ---" + colors.reset + "\n");
}

// Función principal
export async function procesarFacturaAi(rutaArchivo, mimeTypeParam) {
    printHeader("INICIANDO PROCESAMIENTO AVANZADO DE FACTURA");
    log(LOG_LEVEL.INFO, `Archivo a procesar: ${rutaArchivo}`);

    try {
        // Preparar el archivo
        printSubHeader("PREPARACIÓN DEL ARCHIVO");
        const fileContent = await fs.readFile(rutaArchivo);
        
        // Determinar el tipo de archivo de forma más robusta
        const detectedFileTypeInfo = await fileTypeFromBuffer(fileContent);
        const actualMimeType = mimeTypeParam || (detectedFileTypeInfo ? detectedFileTypeInfo.mime : null);

        if (!actualMimeType) {
            throw new Error(`No se pudo determinar el tipo MIME para el archivo: ${rutaArchivo}`);
        }
        log(LOG_LEVEL.INFO, `Archivo cargado. Tipo MIME detectado/provisto: ${actualMimeType}`);

        // --- INICIO DE EXTRACCIÓN DE TEXTO ---
        let textoExtraido = "";
        printSubHeader("EXTRACCIÓN DE TEXTO DEL DOCUMENTO");
        if (actualMimeType === 'application/pdf') {
            log(LOG_LEVEL.INFO, "Detectado archivo PDF, extrayendo texto...");
            try {
                const data = await pdf(fileContent);
                textoExtraido = data.text;
                log(LOG_LEVEL.INFO, "Texto extraído de PDF exitosamente.");
                log(LOG_LEVEL.DEBUG, "Texto PDF (primeros 200 caracteres):", textoExtraido.substring(0, 200) + "...");
            } catch (pdfError) {
                log(LOG_LEVEL.ERROR, `Error al extraer texto del PDF: ${pdfError.message}`);
                log(LOG_LEVEL.WARN, "Se continuará el procesamiento sin el texto extraído localmente del PDF.");
            }
        } else if (actualMimeType.startsWith('image/')) {
            log(LOG_LEVEL.INFO, `Detectado archivo de imagen (${actualMimeType}), extrayendo texto con OCR...`);
            try {
                const { data: { text: ocrText } } = await Tesseract.recognize(
                    fileContent,
                    'spa', // Idioma para OCR (español). Ajustar si es necesario.
                    { 
                        logger: m => {
                            if (currentLogLevel >= LOG_LEVEL.DEBUG) { // Solo loguear progreso en DEBUG
                                log(LOG_LEVEL.DEBUG, `OCR Progress: ${m.status} (${(m.progress * 100).toFixed(2)}%)`);
                            }
                        }
                    }
                );
                textoExtraido = ocrText;
                log(LOG_LEVEL.INFO, "Texto extraído de imagen con OCR exitosamente.");
                log(LOG_LEVEL.DEBUG, "Texto OCR (primeros 200 caracteres):", textoExtraido.substring(0, 200) + "...");
            } catch (ocrError) {
                log(LOG_LEVEL.ERROR, `Error al extraer texto de la imagen con OCR: ${ocrError.message}`);
                log(LOG_LEVEL.WARN, "Se continuará el procesamiento sin el texto extraído localmente de la imagen.");
            }
        } else {
            log(LOG_LEVEL.WARN, `Tipo de archivo no soportado para extracción de texto directa: ${actualMimeType}. Se procederá sin texto extraído localmente.`);
        }
        textoExtraido = textoExtraido.trim();
        // --- FIN DE EXTRACCIÓN DE TEXTO ---

        const imagePart = {
            inlineData: {
                data: fileContent.toString('base64'),
                mimeType: actualMimeType // Usar el mimeType determinado consistentemente
            }
        };
        const modelName = process.env.AI_MODEL; // Nombre del modelo como en el original
        log(LOG_LEVEL.INFO, `Iniciando procesamiento con modelo ${colors.bright}${modelName}${colors.reset}${colors.dim}...`);
    
        try {
            const promptConTextoExtraido = `Texto identificado en la factura: ${textoExtraido}`;
            
            console.log(colors.cyan + "Prompt (parte textual) enviado al modelo:" + colors.reset);
            const textoConcatenadoParaLog = promptConTextoExtraido.length > 500
                ? `Texto identificado en la factura: ${textoExtraido.substring(0, 220)}...\n... (texto extraído truncado para log, total ${textoExtraido.length} caracteres) ...\n...${textoExtraido.substring(textoExtraido.length - 220)}`
                : promptConTextoExtraido;
            console.log(colors.dim + textoConcatenadoParaLog + colors.reset);

            const safetySettings = [
                { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
            ];
    
            const generationConfig = {
                "temperature": 0.3,
                "top_p": 0.99,
                "top_k": 130,
                "max_output_tokens": 4000,
                "response_mime_type": "application/json",
            };
    
            const modelGemini = genAI.getGenerativeModel({
                model: modelName,
                safetySettings,
                systemInstruction: systemInstruction,
                generationConfig
            });
            log(LOG_LEVEL.INFO, "Iniciando chat con el modelo de IA...");
    
            const chat = modelGemini.startChat({
                history: facturas.map(factura => [
                    {
                        role: "user",
                        parts: [
                            { text: "Factura:" }, // Asumo que factura.file es una ImagePart como la que se construye aquí
                            factura.file 
                        ]
                    },
                    {
                        role: "model",
                        parts: [{ text: JSON.stringify(factura.response) }]
                    }
                ]).flat()
            });
            
            const result = await chat.sendMessage([
                { text: promptConTextoExtraido }, // Aquí se envía el texto extraído junto con la frase base
                imagePart
            ]);
    
            const response = await result.response;
            const text = response.text();
    
            try {
                const jsonResponse = JSON.parse(text);
                log(LOG_LEVEL.INFO, `Modelo ${modelName} completó el procesamiento exitosamente`);
                console.log(colors.green + "Respuesta del modelo:" + colors.reset);
                console.log(colors.dim + JSON.stringify(jsonResponse, null, 2) + colors.reset);
                console.log(colors.dim + "─".repeat(80) + colors.reset);
                log(LOG_LEVEL.INFO, `Procesamiento completado para ${modelName}`);
                console.log(colors.dim + "─".repeat(80) + colors.reset);
                log(LOG_LEVEL.INFO, `Validando factura...`);

                const validacionAFIP = await verificarFactura(jsonResponse);
                if (!validacionAFIP.valido) {
                    throw new Error(`La factura no es válida: ${validacionAFIP.observaciones || 'Sin observaciones'}`);
                } else {
                    console.log("La factura es valida para ARCA")
                }
                return jsonResponse;
                
            } catch (jsonError) {
                log(LOG_LEVEL.ERROR, `Error al convertir la respuesta a JSON del modelo ${modelName}`);
                log(LOG_LEVEL.ERROR, "Error específico: " + jsonError.message);
                log(LOG_LEVEL.WARN, "Respuesta original del modelo:");
                console.log(colors.dim + "─".repeat(80) + colors.reset);
                console.log(colors.yellow + text + colors.reset);
                console.log(colors.dim + "─".repeat(80) + colors.reset);
                throw new Error(`Respuesta inválida del modelo ${modelName}: no es un JSON válido. Respuesta original: ${text.substring(0,500)}...`);
            }
            
        } catch (error) {
            log(LOG_LEVEL.ERROR, `Error procesando con modelo ${modelName}: ${error.message}`);
            // Si el error es de la API de Gemini, podría contener más detalles
            if (error.response && error.response.data) {
                log(LOG_LEVEL.DEBUG, "Detalles del error de API:", JSON.stringify(error.response.data));
            }
            throw error;
        }
        
    } catch (error) {
        printHeader("ERROR EN EL PROCESAMIENTO");
        log(LOG_LEVEL.ERROR, error.message);
        if (error.stack && currentLogLevel >= LOG_LEVEL.DEBUG) {
            log(LOG_LEVEL.DEBUG, "Stack trace:", error.stack);
        }
        throw error;
    }
}

// Ejemplo de uso (si se ejecuta directamente el archivo)
// Asegúrate de que 'factura1.webp' exista o cambia la ruta y el tipo.
// También puedes probar con un PDF: procesarFacturaAi("ruta/a/tu/factura.pdf", "application/pdf");
// procesarFacturaAi("factura1.webp", "image/webp").catch(e => console.error("Error final:", e.message));

// Para ejecutar la función original con el archivo de ejemplo:


procesarFacturaAi("factura26.jpg", "image/jpeg");