/**
 * Módulo de validación de facturas electrónicas
 * Gestiona la autenticación con AFIP, verifica la validez de las facturas,
 * y realiza consultas al webservice de AFIP para validar los comprobantes.
 * Incluye manejo de tokens de autenticación y procesamiento de respuestas XML.
 */

import dotenv from "dotenv";
import { executeWSAAScript, parseResponseXml } from './executeWSAA.js';
import { parseString } from 'xml2js';
import { promisify } from 'util';
const soapParseStringPromise = promisify(parseString);
import soapRequest from 'easy-soap-request';

// Configuración de variables de entorno
dotenv.config();

async function obtenerTokenYSign() {
  let error;
  let intentos = 0;
  while (intentos < 5) {
    try {
      await executeWSAAScript();
      const { token, sign } = await parseResponseXml();
      console.log('Token:', token);
      console.log('Sign:', sign);
      return { token, sign };
    } catch (error) {
      intentos++;
      console.error(`Error obteniendo token y sign. Intento ${intentos}.`, error);
      if (intentos === 5) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function consultarWSCDC(datosFactura) {

  // const datosFactura = {
  //   "codigoFactura": "0003-00001112",
  //   "tipoFactura": "A",
  //   "fechaEmision": "2022-04-08",
  //   "fechaVencimiento": "2022-04-18",
  //   "codigoAutorizacionTipo": "CAE",
  //   "codigoAutorizacion": "72141953268317",
  //   "fechaCodigoAutorizacion": "2022-04-18",
  //   "tipoCompra": "Service",
  //   "emisor": {
  //     "nombre": "KRIMAX",
  //     "direccion": "Av. Leandro N.Alem 592 Piso 10 C.A.B.A - Argentina",
  //     "telefono": null,
  //     "email": null,
  //     "CUIT": "20266261781"
  //   },
  //   "items": [
  //     {
  //       "codigo": null,
  //       "descripcion": "Alquiler infraestructura",
  //       "cantidadUnidades": 1,
  //       "precioUnidad": 81725,
  //       "importeItem": 81725,
  //       "bonificacion": null
  //     }
  //   ],
  //   "subtotal": 81725,
  //   "impuestos": {
  //     "IVA": {
  //       "tasa": 0.21,
  //       "monto": 17162.25
  //     }
  //   },
  //   "total": 98887.25,
  //   "totalTrasVencimiento": null,
  //   "divisa": null
  // };

  try {
    const { token, sign } = await obtenerTokenYSign();
    const url = 'https://servicios1.afip.gov.ar/wscdc/service.asmx?WSDL';
    const headers = {
        'Content-Type': 'text/xml;charset=UTF-8', // Cambiado a text/xml
        'soapAction': 'http://servicios1.afip.gob.ar/wscdc/ComprobanteConstatar',
    };

    const impTotal = parseFloat(datosFactura.total).toFixed(2);
    const cuitEmisor = datosFactura.emisor.CUIT.replace(/[^0-9]/g, '');
    const ptoVta = datosFactura.codigoFactura.split('-')[0].padStart(4, '0');
    const nroComprobante = datosFactura.codigoFactura.split('-')[1].padStart(8, '0');
    const fechaEmision = datosFactura.fechaEmision.replace(/-/g, '');

    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsc="http://servicios1.afip.gob.ar/wscdc/">
<soapenv:Body>
    <wsc:ComprobanteConstatar>
        <wsc:Auth>
            <wsc:Token>${token}</wsc:Token>
            <wsc:Sign>${sign}</wsc:Sign>
            <wsc:Cuit>30714180165</wsc:Cuit>
        </wsc:Auth>
        <wsc:CmpReq>
            <wsc:CbteModo>${datosFactura.codigoAutorizacionTipo || 'CAE'}</wsc:CbteModo>
            <wsc:CuitEmisor>${cuitEmisor}</wsc:CuitEmisor>
            <wsc:PtoVta>${ptoVta}</wsc:PtoVta>
            <wsc:CbteTipo>${datosFactura.tipoFactura === 'A' ? '001' : datosFactura.tipoFactura === 'B' ? '006' : datosFactura.tipoFactura === 'C' ? '011' : ''}</wsc:CbteTipo>
            <wsc:CbteNro>${nroComprobante}</wsc:CbteNro>
            <wsc:CbteFch>${fechaEmision}</wsc:CbteFch>
            <wsc:ImpTotal>${impTotal}</wsc:ImpTotal>
            <wsc:CodAutorizacion>${datosFactura.codigoAutorizacion}</wsc:CodAutorizacion>
            <wsc:DocTipoReceptor>80</wsc:DocTipoReceptor>
            <wsc:DocNroReceptor>30714180165</wsc:DocNroReceptor>
        </wsc:CmpReq>
    </wsc:ComprobanteConstatar>
</soapenv:Body>
</soapenv:Envelope>`;

    console.log('\nEstructura final enviada a WSCDC:', xmlBody);

    const options = {
        url: url,
        headers: headers,
        xml: xmlBody, // Enviar el XML directamente
    };

    const { response } = await soapRequest(options);
    const { body, statusCode } = response;

    console.log('Código de estado:', statusCode);
    console.log('Respuesta del servidor:', body);

    try {
      const responseData = await soapParseStringPromise(body);
      console.log('\nRespuesta de WSCDC (JSON):', JSON.stringify(responseData, null, 2));

      // Navegar por la estructura del XML parseado para extraer la información relevante
      const resultadoConsulta = responseData['soap:Envelope']['soap:Body'][0]['ComprobanteConstatarResponse'][0]['ComprobanteConstatarResult'][0];
      let errores = null;
      if (resultadoConsulta && resultadoConsulta['Observaciones'] && resultadoConsulta['Observaciones'][0] && resultadoConsulta['Observaciones'][0]['Obs']) {
        errores = resultadoConsulta['Observaciones'][0]['Obs'].map(obs => obs['Msg'][0]);
      }

      // Manejo de errores: Verificar si existen errores en la respuesta
      if (errores) {
        console.error("Errores del WSCDC:", errores);
        return { valido: false, observaciones: errores.join(', ') }; // Devuelve errores combinados en un string.
      }

      // Si no hay errores, extraer el resultado y las observaciones (si existen)
      const resultado = resultadoConsulta.Resultado[0];
      const observaciones = errores ? errores : null;

      console.log('\nResultado de WSCDC:', resultado);
      console.log('\nObservaciones de WSCDC:', observaciones);

      return {
          valido: resultado === 'A',
          observaciones: observaciones ? observaciones.join(', ') : null // Unir observaciones en un string si hay varias
      };

  } catch (parseError) {
      console.error("Error al parsear la respuesta XML:", parseError);
      console.error("Cuerpo de la respuesta que fallo:",body);
      return { valido: false, observaciones: `Error al parsear la respuesta: ${parseError.message}` };
  }

  } catch (error) {
    console.error('Error al consultar WSCDC:', error);
    throw error;
  }
}
// async function validarFactura(rutaArchivo) {
//   console.log(`\nIniciando validación de factura: ${rutaArchivo}`);
  
//   try {
//     // Optimizar imagen
//     const imageFilePath = await optimizeImage(rutaArchivo);
//     console.log('Imagen optimizada correctamente');

//     // Configurar modelo IA
//     const model = genAI.getGenerativeModel({ 
//       model: "gemini-1.5-flash",
//       generationConfig: {
//         temperature: 0.4,
//         topP: 0.99,
//         topK: 130,
//         maxOutputTokens: 1000,
//         responseMimeType: "application/json",
//       }
//     });

//     // Crear chat y procesar imagen
//     const chat = model.startChat({
//       history: facturas.map(factura => [
//         { role: "user", parts: [{ text: "Factura:" }, factura.file] },
//         { role: "model", parts: [{ text: JSON.stringify(factura.response) }] }
//       ]).flat()
//     });

//     const imagenUsuario = await fileToGenerativePart(imageFilePath, "image/webp");
//     const result = await chat.sendMessage([
//       { text: "factura:" },
//       imagenUsuario
//     ]);

//     const text = result.response.text();
//     console.log('\nDatos extraídos de la factura:', text);

//     if (text.startsWith("An error occurred")) {
//       throw new Error("Error en la respuesta del modelo de IA: " + text);
//     }

//     const jsonDataParsed = JSON.parse(text);
    
//     // Obtener token y sign
//     console.log('\nObteniendo credenciales de AFIP...');
//     // const { token, sign } = await obtenerTokenYSign();

//     // Validar con AFIP
//     console.log('\nValidando factura con AFIP...');
//     const validacionAFIP = await consultarWSCDC(jsonDataParsed);

//     console.log('\nResultado de la validación:', 
//       validacionAFIP.valido ? 
//       '✅ La factura es válida' : 
//       `❌ La factura no es válida: ${validacionAFIP.observaciones || 'Sin observaciones'}`
//     );

//     // Limpiar archivo temporal
//     await fs.unlink(imageFilePath);
    
//     return {
//       datosFactura: jsonDataParsed,
//       validacionAFIP
//     };

//   } catch (error) {
//     console.error('\nError en el proceso de validación:', error);
//     throw error;
//   }
// }
export async function verificarFactura(datosFactura) {
  try {
    const validacionAFIP = await consultarWSCDC(datosFactura);
    return validacionAFIP;
  } catch (error) {
    console.error('Error al verificar la factura:', error);
    throw error;
  }
}

// module.exports = { verificarFactura };


