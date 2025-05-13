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


