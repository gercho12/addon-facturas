// contexto.js

import fs from "fs";

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

export const facturas = [
  // {
  //   file: fileToGenerativePart("entrenamiento/factura1.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "000100000743",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2018-03-30",
  //     "fechaVencimiento": "2018-10-20",
  //       "codigoAutorizacionTipo": "CAI",
  //       "codigoAutorizacion": "43420118706402",
  //     "fechaCodigoAutorizacion": "2018-10-20",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "TRANSPORTE EDIJ",
  //       "direccion": "Osvaldo Cruz 3895 - PB Dpto: A - T: 16 (1437) C.A.B.A.",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "20232510340"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "POR LA LOGISTICA DE EQUIPOS CARGA Y DESCARGA INCLUYE VIATICOS",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 20768.55,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 20768.55,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 4361.39 }
  //     },
  //     "total": 25129.94,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura2.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0003-00001112",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2022-04-08",
  //     "fechaVencimiento": "2022-04-18",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "72141953268317",
  //     "fechaCodigoAutorizacion": "2022-04-18",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "KRIMAX",
  //       "direccion": "Av. Leandro N.Alem 592 Piso 10 C.A.B.A - Argentina",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "20266261781"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Alquiler infraestructura",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 81725,
  //         "importeItem": 81725,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 81725,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 17162.25 }
  //     },
  //     "total": 98887.25,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura3.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0003-00000762",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2019-07-11",
  //     "fechaVencimiento": "2019-07-11",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69281651023436",
  //     "fechaCodigoAutorizacion": "2019-07-21",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "KNOFLER ROBERTO JOSE",
  //       "direccion": "Virrey Olaguer Feliu 2320 (1636) - OLIVOS - ARGENTINA",
  //       "telefono": "4795-6530",
  //       "email": "administracion@divise.com.ar",
  //       "CUIT": "20925047741"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "solinntec.com - Plan BUSINESS - Abono trimestral de servicio de alojamiento web",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 360,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 360,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 360,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura4.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0004-00001131",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-25",
  //     "fechaVencimiento": "2019-08-04",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69306123696225",
  //     "fechaCodigoAutorizacion": "2019-08-04",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Seidor Argentis S.A",
  //       "direccion": "Colonia 25 Piso 5 (1437) - Capital Federal Ciudad Autónoma de Buenos Aires - Capital Federal",
  //       "telefono": "5533-3100",
  //       "email": "cobranzasar@seidor.com",
  //       "CUIT": "30712265546"
  //     },
  //     "items": [
  //       {
  //         "codigo": "SER",
  //         "descripcion": "SERVICIOS EN GENERAL Bolsa de Horas Soporte x 36",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 1260.00,
  //         "importeItem": 1260.00,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 1260.00,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 264.60
  //       }
  //     },
  //     "total": 1524.60,
  //     "totalTrasVencimiento": null,
  //     "divisa": "USD"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura5.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0020-00085920",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2018-01-25",
  //     "fechaVencimiento": "2018-02-04",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "68042170581796",
  //     "fechaCodigoAutorizacion": "2018-04-02",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "H. Trimarchi S.R.L.",
  //       "direccion": "Abraham J. Luppi 1535 -C1437FRN - Capital Federal - Argentina",
  //       "telefono": "(+54-11) 49184900",
  //       "email": "info@trimarchi.com.ar",
  //       "CUIT": "30659939122"
  //     },
  //     "items": [
  //       {
  //         "codigo": "51451",
  //         "descripcion": "Rueda carg",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 1431.46,
  //         "importeItem": 1431.46,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 1431.46,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 300.61 }
  //     },
  //     "total": 1775.01,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura6.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "2465-00052626",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-07",
  //     "fechaVencimiento": "2019-07-26",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "17225192681796",
  //     "fechaCodigoAutorizacion": "2019-07-25",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "movistar",
  //       "direccion": "Defensa 143 CABA - Av. Independencia 169 PB CABA",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "30678814357"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Percepcion Ingresos Brutos - DN B 1-2004",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 155.85,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Ley 27.430 \"impuestos\" Internos 5.2631%",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 205.07,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": null,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.27, "monto": 1052 }
  //     },
  //     "total": 5309.2,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura7.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0003-00003162",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-08",
  //     "fechaVencimiento": "2019-07-18",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69285608331725",
  //     "fechaCodigoAutorizacion": "2019-07-18",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "WeWork Argentina SRL",
  //       "direccion": "Av. Del Libertador 1000 - Vicente Lopez, Buenos Aires",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "30715334255"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Descuento",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 3284.82,
  //         "importeItem": 3284.82,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Cuota de Membresía",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 21899,
  //         "importeItem": 21899,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 18614.18,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 3908.98
  //       }
  //     },
  //     "total": 23267.73,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura8.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0002-00023314",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-03",
  //     "fechaVencimiento": "2019-07-13",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69271424006427",
  //     "fechaCodigoAutorizacion": "2019-07-13",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "RM Electronica Group SRL",
  //       "direccion": "Av. Santa Fe 2451 B 1640 - 000 Martinez",
  //       "telefono": "4792-6912",
  //       "email": null,
  //       "CUIT": "30710767331"
  //     },
  //     "items": [
  //       {
  //         "codigo": "001",
  //         "descripcion": "Abono Monitoreo de Alarma Julio 2019",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 980,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 980,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 205.8 }
  //     },
  //     "total": 1185.8,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura9.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0003-00019014",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2017-11-02",
  //     "fechaVencimiento": "2017-11-02",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "67441317776830",
  //     "fechaCodigoAutorizacion": "2017-12-11",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "TRUCKS EXPRESS S.R.L.",
  //       "direccion": "Avda Guemes 533 (7500) Tres Arroyos - Buenos Aires",
  //       "telefono": "(02983) - 433399",
  //       "email": "trucksexpress@powervisual.com.ar",
  //       "CUIT": "30707631631"
  //     },
  //     "items": [
  //       {
  //         "codigo": "1",
  //         "descripcion": "REMITEE H.TRIMARCHI S.R.L. 0010-00065628-29-656817-16 Valor Asegurado $ 150.000,00",
  //         "cantidadUnidades": 45,
  //         "precioUnidad": 168.88,
  //         "importeItem": 7599.6,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": "ZZZ",
  //         "descripcion": "PAGA DESTINATARIO",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 1080,
  //         "importeItem": 1080,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 8679.6,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 1822.72 }
  //     },
  //     "total": 10502.32,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura10.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "00003-00001485",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2022-04-04",
  //     "fechaVencimiento": "2022-04-04",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "72141588951894",
  //     "fechaCodigoAutorizacion": "2022-04-14",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "KNOFLER ROBERTO JOSE",
  //       "direccion": "Virrey Olaguer Feliu 2320 (1636) - OLIVOS - ARGENTINA",
  //       "telefono": "1141589571",
  //       "email": "administracion@divise.com.ar",
  //       "CUIT": "20925047741"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Proporcional del decreto 184-2020",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 135,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Res. Gral. 4815-2020",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 198,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Plan BUSINESS - Abono trimestral de servicio de alojamiento web",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 567,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Recargo pago fuera de término",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 58,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 958,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 958,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura11.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0004-00000388",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2020-12-09",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "70509730844439",
  //     "fechaCodigoAutorizacion": "2020-12-19",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "INFORMATICA FACIL",
  //       "direccion": "N.S. de la Merced 4641 (1678) - Caseros - Buenos Aires",
  //       "telefono": "11 4750 1112",
  //       "email": "info@informaticafacil.com",
  //       "CUIT": "23214922479"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "SSD DISCO SOLIDO GIGABYTE 240GB",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 2730.47,
  //         "importeItem": 2730.47,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "GABINETE TERMALTAKE V200 TG 500WTS",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 12170.9,
  //         "importeItem": 12170.9,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Memoria DDR4 8 GB 2666 KING. H. FURY RGB BLACK",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 3842.12,
  //         "importeItem": 3842.12,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "MICROProces. Intel CometLake Core i5 10400F s-v",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 17994.53,
  //         "importeItem": 17994.53,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Mother MSI B460M MORTAR S1200 DDR4 10ma gen",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 11834.9,
  //         "importeItem": 11834.9,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "VGA MSI GEFORCE GTX 1650 GAMING 4G",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 19621.99,
  //         "importeItem": 19621.99,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "HD SEAGATE 1TB SATAIII 64Mb BARRACUDA",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 3806.79,
  //         "importeItem": 3806.79,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 72001.7,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.105, "monto": 7560.18 }
  //     },
  //     "total": 79561.88,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura12.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0001 - 0000094",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2017-11-10",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAI",
  //       "codigoAutorizacion": "43015084150028",
  //     "fechaCodigoAutorizacion": "2018-03-01",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "MUNDO DEL ASCENSOR de Pamela Pato",
  //       "direccion": "Los Robles del Monarca 2647 (1629) Pilar Bs.As.",
  //       "telefono": "(011) 15-2851-2785",
  //       "email": "pameladelascensor@mundodelascensor.com.ar",
  //       "CUIT": "27283611235"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "onexdomicilio termico Ascensores",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 35000,
  //         "importeItem": 35000,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": null,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 3500,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura13.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0020-00079534",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2017-07-21",
  //     "fechaVencimiento": "2017-07-31",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "67302130887994",
  //     "fechaCodigoAutorizacion": "2017-07-31",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "H. Trimarchi S.R.L.",
  //       "direccion": "Abraham J. Luppi 1535 -C1437FRN - Capital Federal - Argentina",
  //       "telefono": "(+54-11) 49184900",
  //       "email": "info@trimarchi.com.ar",
  //       "CUIT": "30659939122"
  //     },
  //     "items": [
  //       {
  //         "codigo": "4050",
  //         "descripcion": "Cerrad Hoja Nueva Cr-rueda -Der C-gancho",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 341.67,
  //         "importeItem": 341.67,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": "4050",
  //         "descripcion": "Cerrad Hoja Nueva Cr-rueda -Der C-gancho",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 341.67,
  //         "importeItem": 341.67,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 683.34,
  //     "impuestos": {
  //       "IVA": { "tasa": 0.21, "monto": 143.5 }
  //     },
  //     "total": 847.34,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura14.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0001-0000081",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2017-08-16",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAI",
  //       "codigoAutorizacion": "42378071651214",
  //     "fechaCodigoAutorizacion": "2017-09-13",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Rubén Felix Siervo",
  //       "direccion": "Ituzaingo N° 775 - Tel. (02983) 484104 CP 7513 - Adolfo Gonzales Chaves - Pcia. Bs. As.",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "20114617718"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Por mano de obra en paredes para colocacion de ascensores en Municipio de Adolfo Gonzales Chaves",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 19800,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Trabajo fuera de presupuesto escuadrer esbacion encofrarla con hierro Sum y hormigonarla.",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 3800,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": null,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 23600,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura15.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "E02008MUEP",
  //     "tipoFactura": null,
  //     "fechaEmision": "2019-07-21",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": null,
  //       "codigoAutorizacion": null,
  //     "fechaCodigoAutorizacion": null,
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Microsoft",
  //       "direccion": null,
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": null
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Cargos periódicos",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 321.8,
  //         "importeItem": 321.8,
  //         "bonificacion": 0.00
  //       }
  //     ],
  //     "subtotal": 321.8,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 321.8,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura16.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0004-00000411",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-01",
  //     "fechaVencimiento": "2019-07-31",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69269322201900",
  //     "fechaCodigoAutorizacion": "2019-07-11",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Quiales Group",
  //       "direccion": "Unarle 2130 Piso: 3ro Dpto: A - CP: 1425 - Ciudad Autónoma de Buenos Aires",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "30714774529"
  //     },
  //     "items": [
  //       {
  //         "codigo": "BPC - 201906",
  //         "descripcion": "Gador - Mantenimiento Evolutivo",
  //         "cantidadUnidades": 30,
  //         "precioUnidad": 909,
  //         "importeItem": 27270,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 27270,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 5726.7
  //       }
  //     },
  //     "total": 32996.7,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura17.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "00001-00000173",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2019-07-13",
  //     "fechaVencimiento": "2019-07-13",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69284717831791",
  //     "fechaCodigoAutorizacion": "2019-07-23",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "DEL BRUTTO ALEJANDRO",
  //       "direccion": "Quito 4336 Piso:4 Dpto:C - Ciudad de Buenos Aires",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "20203402164"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Servicios profesionales SAP BUSINESS ONE junio 2019",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 30000,
  //         "importeItem": 30000,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 30000,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 30000,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura18.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0020-00085920",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2018-01-25",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69284717831791",
  //     "fechaCodigoAutorizacion": "2019-07-23",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "H. Trimarchi S.R.L.",
  //       "direccion": "Abraham J. Luppi 1535 -C1437FRN - Capital Federal - Argentina",
  //       "telefono": "(+54-11) 49184900",
  //       "email": "info@trimarchi.com.ar",
  //       "CUIT": "30659939122"
  //     },
  //     "items": [
  //       {
  //         "codigo": "51451",
  //         "descripcion": "Rueda carg",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 1431.46,
  //         "importeItem": 1431.46,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 1431.46,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 300.61
  //       }
  //     },
  //     "total": 1775.01,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura19.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0004-00001121",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2019-07-18",
  //     "fechaVencimiento": "2019-07-18",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69296880071112",
  //     "fechaCodigoAutorizacion": "2019-07-28",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Seidor Argentis S.A",
  //       "direccion": "Colonia 25 Piso 5 (1437) - Capital Federal Ciudad Autónoma de Buenos Aires - Capital Federal",
  //       "telefono": "5533-3100",
  //       "email": "cobranzasar@seidor.com",
  //       "CUIT": "30712265546"
  //     },
  //     "items": [
  //       {
  //         "codigo": "SER",
  //         "descripcion": "SERVICIOS EN GENERAL SERVICIOS",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 4403,
  //         "importeItem": 4403,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 4403,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 924.63
  //       }
  //     },
  //     "total": 5327.63,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura20.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "00001-00000173",
  //     "tipoFactura": "C",
  //     "fechaEmision": "2019-07-13",
  //     "fechaVencimiento": "2019-07-13",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "69284717831791",
  //     "fechaCodigoAutorizacion": "2019-07-23",
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "DEL BRUTTO ALEJANDRO",
  //       "direccion": "Quito 4336 Piso:4 Dpto:C - Ciudad de Buenos Aires",
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "20203402164"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Servicios profesionales SAP BUSINESS ONE junio 2019",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 30000,
  //         "importeItem": 30000,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 30000,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0,
  //         "monto": 0
  //       }
  //     },
  //     "total": 30000,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura21.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "A00010-00693672",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2024-04-02",
  //     "fechaVencimiento": "2024-04-09",
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "74147506527427",
  //     "fechaCodigoAutorizacion": "2017-04-12",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "Alyser",
  //       "direccion": "Dardo Rocha 2324 - 1° Piso (B1640FT) Martinez",
  //       "telefono": "+54 (011) 3220-1000",
  //       "email": "ventas@alyser.com.ar",
  //       "CUIT": "30707760237"
  //     },
  //     "items": [
  //       {
  //         "codigo": "149832601",
  //         "descripcion": "TOMATE TRITURADO RIO SALADO X 8 KG",
  //         "cantidadUnidades": 2,
  //         "precioUnidad": 7714.8,
  //         "importeItem": 15429.6,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "372513201",
  //         "descripcion": "COLORANTE AMARILLO EMETH X 2 LTS",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 4233.6,
  //         "importeItem": 4233.6,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "1444903405",
  //         "descripcion": "DURAZNOS CAJA 12 X 820 GRS CANALE",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 16888.5,
  //         "importeItem": 16888.5,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "1444915213",
  //         "descripcion": "ANANA TROZOS MAROLIO 12X850G",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 53551.8,
  //         "importeItem": 53551.8,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "147611203",
  //         "descripcion": "ATUN AL NATURAL POUCH X 1 KG ECUADOR",
  //         "cantidadUnidades": 16,
  //         "precioUnidad": 13500,
  //         "importeItem": 216000,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "838003601",
  //         "descripcion": "PULPALIST-C TAXONERA X 14 KG",
  //         "cantidadUnidades": 2,
  //         "precioUnidad": 32019.3,
  //         "importeItem": 64038.6,
  //         "bonificacion": 0
  //       },
  //       {
  //         "codigo": "835199902",
  //         "descripcion": "GELATINA 180 BLOOM X 1 KG S-SABOR",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 18467.1,
  //         "importeItem": 18467.1,
  //         "bonificacion": 0
  //       }
  //     ],
  //     "subtotal": 388609.2,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 81607.93
  //       }
  //     },
  //     "total": 476434.88,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura22.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": null,
  //     "tipoFactura": null,
  //     "fechaEmision": "2019-07-10",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": null,
  //       "codigoAutorizacion": null,
  //     "fechaCodigoAutorizacion": null,
  //     "tipoCompra": "Service",
  //     "emisor": {
  //       "nombre": "Allianz",
  //       "direccion": null,
  //       "telefono": null,
  //       "email": null,
  //       "CUIT": "30500037217"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "Prima",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 41709.99,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "Recargo Financiero",
  //         "cantidadUnidades": null,
  //         "precioUnidad": null,
  //         "importeItem": 45880.99,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 45880.99,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 9635.01
  //       }
  //     },
  //     "total": 60287.62,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura23.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0006-00010365",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2017-11-29",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAI",
  //       "codigoAutorizacion": "91632695540284",
  //     "fechaCodigoAutorizacion": "2017-11-29",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "BULONERA TORCUATO S.R.L.",
  //       "direccion": "Ruta 202 N° 2335 B1614AB Don Torcuato - Bs.As. Legomarc 385 (ex Ruta Km. 32.100) (1624) Pilar - Bs.As.",
  //       "telefono": "0230443-4355",
  //       "email": "ventatorcuato@btar.com.ar",
  //       "CUIT": "38714188065"
  //     },
  //     "items": [
  //       {
  //         "codigo": null,
  //         "descripcion": "SIERRA COPA 83mm. 1.1-2 MORSE",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 187.8624,
  //         "importeItem": 187.86,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "MANDRIL PORTA SIERRA M45P 32-152mm. MORSE",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 358.1344,
  //         "importeItem": 358.13,
  //         "bonificacion": null
  //       },
  //       {
  //         "codigo": null,
  //         "descripcion": "RESORTE EXP. 1.75X12.00X1MTS",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 145.9439,
  //         "importeItem": 145.94,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 693.14,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.21,
  //         "monto": 143.46
  //       }
  //     },
  //     "total": 860.76,
  //     "totalTrasVencimiento": null,
  //     "divisa": null
  //   }
  // },
  // {
  //   file: fileToGenerativePart("entrenamiento/factura24.webp", "image/webp"),
  //   mimeType: "image/webp",
  //   response: {
  //     "codigoFactura": "0020-00079966",
  //     "tipoFactura": "A",
  //     "fechaEmision": "2017-08-03",
  //     "fechaVencimiento": null,
  //       "codigoAutorizacionTipo": "CAE",
  //       "codigoAutorizacion": "67312388525794",
  //     "fechaCodigoAutorizacion": "2017-08-13",
  //     "tipoCompra": "Items",
  //     "emisor": {
  //       "nombre": "H. Trimarchi S.R.L.",
  //       "direccion": "Abraham J. Luppi 1535 -C1437FRN - Capital Federal - Argentina",
  //       "telefono": "(+54-11) 49184900",
  //       "email": "info@trimarchi.com.ar",
  //       "CUIT": "30659939122"
  //     },
  //     "items": [
  //       {
  //         "codigo": "GG-GG-GG-GGGG-99",
  //         "descripcion": "Kit Asensor Esp 2p hd",
  //         "cantidadUnidades": 1,
  //         "precioUnidad": 192780,
  //         "importeItem": 192780,
  //         "bonificacion": null
  //       }
  //     ],
  //     "subtotal": 192780,
  //     "impuestos": {
  //       "IVA": {
  //         "tasa": 0.105,
  //         "monto": 20241.95
  //       }
  //     },
  //     "total": 218805.3,
  //     "totalTrasVencimiento": null,
  //     "divisa": "ARS"
  //   }
  // }
];
 
export const systemInstruction = `
      Eres un asistente encargado de procesar facturas de manera exhaustiva y precisa, 
      sin importar su formato, para extraer y estructurar los datos contenidos en ellas.
      Recibes archivos de factura en formato de imagen o PDF, los analizas parte por parte
      de manera profunda y minuciosa, asegurandote de que cada dato encontrado y los caracteres identificados
      son los correctos y devuelves los datos en formato JSON para su inserción directa
      en una base de datos de gestión de facturas.

      La estructura del JSON que generarás será la siguiente
      (los datos utilizados para completar los campos son de ejemplo para que conozcas un poco mas el formato):
      
      {
        "codigoFactura": "0001-123456",
        "tipoFactura": "A",
        "fechaEmision": "2024-05-14",
        "fechaVencimiento": "2024-06-14",
        "codigoAutorizacionTipo": "CAE",
        "codigoAutorizacion": "99999999999999",
        "fechaCodigoAutorizacion": "2024-10-08",
        "tipoCompra": "Service",
        "emisor": {
          "nombre": "Nombre De La Empresa Emisora",
          "direccion": "Calle de la Empresa Emisora, Ciudad, País",
          "telefono": 1234567890,
          "email": "info@empresaemisora.com",
          "CUIT": "30685376349"
        },
        "items": [
          {
            "codigo": 34345322,
            "descripcion": "Cargo Mensual Servicio",
            "cantidadUnidades": 1,
            "precioUnidad": 1000,
            "importeItem": 1000,
            "bonificacion": 0.00
          },
          {
            "codigo": 1245343,
            "descripcion": "Nombre Del Producto 850gr x 12",
            "cantidadUnidades": 2,
            "precioUnidad": 1000,
            "importeItem": 1000,
            "bonificacion": 0.50
          }
        ],
        "subtotal": 30200.84,
        "impuestos": {
          "IVA": {
            "tasa": 0.21,
            "monto": 6342.17
          }
        },
        "total": 38657.04,
        "totalTrasVencimiento": 42657.04,
        "divisa": "ARS"
      }
      
      la "bonificacion" es el porcentaje de descuento que se le hace a un item sobre su "subtotal"* (importeItem x cantidadUnidades)*, 
      si figura 50% (0.5) significa que el "total" sera la mitad de lo debido. 
      
      - EN EL CASO DE LA FALTA DE UN DATO DARLE UN VALOR NULL (nulo). 

      - Recuerda que tu objetivo es procesar cualquier tipo de factura, desde facturas de compra hasta recibos 
      de alquiler, agua o energia (en esos casos colocandolo en forma de item siendo la "descripcion" y el "importeItem" los unicos 
      valores utilizados), y devolver los datos de manera precisa y estructurada según la estructura indicada.

      - Se cuidadoso con no confundir el cuit del emisor (Generalmente en el encabezado superior junto a los datos del emisor como el
      numero de factura o la fecha de emision) con el cuit del receptor (Junto a los datos del receptor, generalmente mas abajo del
      encabezado superior/cuit del emisor).

      - Las fechas deben ser en formato "aaaa-mm-dd" (año-mes-dia).

      - El Tipo de compra ("tipoCompra") se determina por los articulos o elementos detallados en la factura (que fueron adquiridos por el receptor), en el caso que se 
      trate de servicios colocar "Services" en el caso que se trate de items o articulos colocar "Items".

      - Cuando se extrae el codigoFactura, puede tener dos partes: el número de punto de emisión y el número único, separadas por un guión (-), como en '0001-123456'.
      Sin embargo, estas partes pueden estar en campos separados. Si es así, combinarlas utilizando un guión (-) como separador (ejemplo, si se encuentra un punto de emisión '0001' 
      y un número único '123456' combinarlos como '0001-123456'). Si solo se encuentra el numero unico, colocarlo como codigoFactura

      - El tipo de codigo de autorizacion (CAI o CAE) , el codigo de autorizacion y la fecha del codigo de autorizacion  ("codigoAutorizacionTipo", "codigoAutorizacion", "fechaCodigoAutorizacion") se suelen encontrar juntos generalmente en
      el pie de la factura junto a un codigo de barras o un codigo QR. El tipo de codigo ("codigoAutorizacionTipo") se encuentra generalmente justo previo al codigo de la siguiente manera: 'CAI: 99999999999999' o 'CAE: 99999999999999', siendo estos numeros (codigo) de ejemplo.

      - No confundir fecha de vencimiento (limite) de pago, con el vencimiento del CAE o CAI.
      
      - MANEJO DE DOCUMENTOS MULTI-PÁGINA:
      
      1. COPIAS DE FACTURA (Original/Duplicado/Triplicado):
      Cuando el documento contenga múltiples páginas que representan copias de la misma factura:
      - Identificar si contiene marcadores "ORIGINAL", "DUPLICADO", "TRIPLICADO" (o variantes)
      - Procesar ÚNICAMENTE la versión "ORIGINAL" de la factura
      - Ignorar completamente las versiones duplicadas y triplicadas
      - Si no hay indicación explícita de "ORIGINAL", procesar la primera ocurrencia

      2. FACTURA CONTINUA (Contenido extendido):
      Cuando el contenido de una única factura se extiende a múltiples páginas:
      - Identificar si es continuación por la repetición del encabezado y números de factura
      - Consolidar todos los items de las páginas subsiguientes en el array "items"
      - Para los totales y subtotales, utilizar ÚNICAMENTE los valores finales (generalmente en la última página)
      - NO sumar subtotales o totales de páginas intermedias
      - Mantener un único conjunto de datos de encabezado (emisor, fechas, etc.)
      - Asegurar que el JSON final represente una única factura consolidada

      - En caso de duda sobre el tipo de documento multi-página, priorizar la búsqueda de indicadores 
      "ORIGINAL/DUPLICADO/TRIPLICADO" antes de asumir que es una factura continua.

      - No debes incluir ningun otro caracter fuera del JSON es decir no agregues backticks de mas. Los saltos de linea podrian ser un problema en los datos tipo cadena de texto, 
      utiliza mejor un espacio.

      -No confundas caracteres similares como 8 Y 9
     - Junto al archivo podria tambien enviarse el texto identificado en la factura (obtenido con distintas herramientas)
      para que recurras o tengas en cuenta en caso de estar en duda con algun caracter o informacion especifica.
      NO para usarlo con prioridad ni nada por el estilo, es unicamente una ayuda/aporte mas. 
      Probablemente la informacion no este en el orden correcto, por lo que recurre en caso de duda con algun dato.
      
      Si se proporciona una factura junto con una "INSTRUCCION ESPECIAL:" cumplir con la instrucción proporcionada.

    `;
