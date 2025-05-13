
import { serviceLayerUrl, makeAuthenticatedRequest, handleApiError } from './procesarFactura.js';
import natural from "natural"; // Asegurarse que natural está importado si se usa tokenizer y stemmer

// Inicialización de herramientas de procesamiento de lenguaje natural (si no están ya en procesarFactura.js y se usan aquí)
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export async function obtenerDatosOrdenCompraSAP(ordenCompraNum, sessionId) {
  console.log(`Obteniendo orden de compra número ${ordenCompraNum}...`);
  try {
    const purchaseOrderUrl = `${serviceLayerUrl}PurchaseOrders?$filter=DocNum eq ${ordenCompraNum}`;
    const purchaseOrderResponse = await makeAuthenticatedRequest(purchaseOrderUrl, 'GET', null, sessionId);
    console.log("🟢 Orden de compra obtenida exitosamente de SAP.");

    if (!purchaseOrderResponse || !purchaseOrderResponse.value || purchaseOrderResponse.value.length === 0) {
      throw new Error(`No se encontró la orden de compra con número ${ordenCompraNum}`);
    }
    const purchaseOrder = purchaseOrderResponse.value[0];
    if (!purchaseOrder.DocumentLines || purchaseOrder.DocumentLines.length === 0) {
      throw new Error(`La orden de compra ${ordenCompraNum} no tiene líneas de items`);
    }
    return purchaseOrder;
  } catch (error) {
    handleApiError(error, `la orden de compra ${ordenCompraNum}`);
    // handleApiError ya lanza el error, así que no es necesario un throw aquí explícito
    // si handleApiError no lanzara, necesitaríamos: throw error;
  }
}

export async function validarYEmparejarItemsConOC(jsonDataParsed, sessionId, ordenCompraNum, purchaseOrderSAP) {
  console.log("🟢 Iniciando validación y emparejamiento de ítems con Orden de Compra...");
  try {
    // Se asume que matchPurchaseOrderItems está disponible en este scope (importada o definida previamente en este archivo)
    const { matchedItems, unmatchedItems } = await matchPurchaseOrderItems(
      jsonDataParsed.items,
      jsonDataParsed.total,
      sessionId,
      ordenCompraNum,
      purchaseOrderSAP
    );

    if (unmatchedItems.length > 0) {
      console.warn(`Advertencia: ${unmatchedItems.length} ítems no coincidieron con la OC:`, unmatchedItems);
      throw new Error('No se pudieron emparejar todos los ítems con la Orden de Compra. Proceso cancelado.');
    }

    // verificarTotalFacturas ya lanza un error si la verificación falla, por lo que no se necesita !totalFacturasVerificado.
    await verificarTotalFacturas(ordenCompraNum, jsonDataParsed.total, sessionId);
    
    const docEntryOrdenCompra = await obtenerDocEntryDeOrdenCompra(ordenCompraNum, sessionId);

    console.log("✅ Validación y emparejamiento con OC completados exitosamente.");
    return { matchedItems, docEntryOrdenCompra };
  } catch (error) {
    console.error(`❌ Error durante la validación y emparejamiento con OC para la orden ${ordenCompraNum}:`, error.message);
    throw error; // Re-lanzar para que sea manejado por la función llamante (procesarFactura)
  }
}

export async function verificarTotalFacturas(ordenNro, totalNuevaFactura, sessionId) {
    console.log(`🔍 Verificación de total de facturas para orden ${ordenNro}`);
  
    try {
      // 1. Obtener información de la orden de compra
      const ordenUrl = `${serviceLayerUrl}PurchaseOrders?$filter=DocNum eq ${ordenNro}&$select=DocTotal,DocDate,CardCode`;
      const ordenResponse = await makeAuthenticatedRequest(ordenUrl, 'GET', null, sessionId);
      
      if (!ordenResponse.value || ordenResponse.value.length === 0) {
        throw new Error(`Orden de compra ${ordenNro} no encontrada`);
      }
      
      const orden = ordenResponse.value[0];
      const totalOrden = orden.DocTotal;
      const fechaOrden = new Date(orden.DocDate);
      const cardCode = orden.CardCode;
        
      const formatoFecha = (fecha) => fecha.toISOString().split('T')[0];
  
  
      // 2. Obtener facturas relacionadas a la orden (método original)
      let facturasAsociadas = [];
      let skip = 0;
      const top = 20;
      let continuarBusqueda = true;
  
      while (continuarBusqueda) {
        console.log(`🔄 Obteniendo lote de facturas (skip: ${skip}, top: ${top})...`);
        // Filtro optimizado incluyendo CardCode, fechas y total máximo
        const facturasUrl = `${serviceLayerUrl}PurchaseInvoices?$select=DocEntry,DocTotal,DocDate,DocumentReferences&$filter=CardCode eq '${cardCode}' and DocDate ge '${formatoFecha(fechaOrden)}' and DocDate le '${formatoFecha(new Date())}' and DocTotal le ${totalOrden}&$orderby=DocDate desc&$skip=${skip}&$top=${top}`;
        const facturasRecientes = await makeAuthenticatedRequest(facturasUrl, 'GET', null, sessionId);
        
        if (!facturasRecientes.value || facturasRecientes.value.length === 0) {
          console.log('🛑 No se encontraron más facturas. Finalizando búsqueda.');
          break;
        }
  
        const facturasAsociadasLote = facturasRecientes.value.filter(factura => 
          factura.DocumentReferences && 
          factura.DocumentReferences.some(ref => 
            ref.RefDocNum == ordenNro && ref.RefObjType === 'rot_PurchaseOrder'
          )
        );
  
        facturasAsociadas = facturasAsociadas.concat(facturasAsociadasLote);
        console.log(`📊 Facturas asociadas encontradas en este lote: ${facturasAsociadasLote.length}`);
  
        if (facturasRecientes.value.length < top || new Date(facturasRecientes.value[facturasRecientes.value.length - 1].DocDate) < fechaOrden) {
          console.log('🏁 Se alcanzó el final de las facturas relevantes o la fecha de la orden. Finalizando búsqueda.');
          continuarBusqueda = false;
        } else {
          skip += top;
        }
      }
      console.log(`📑 Total de facturas asociadas encontradas: ${facturasAsociadas.length}`);
  
      const totalFacturasExistentes = facturasAsociadas.reduce((sum, factura) => sum + factura.DocTotal, 0);
  
      console.log(`💰 Total de facturas existentes: ${totalFacturasExistentes}`);
      console.log(`💰 Total de la nueva factura: ${totalNuevaFactura}`);
  
      // Obtener DocEntry de facturas
      const docentriesFacturas = facturasAsociadas.map(factura => factura.DocEntry);
  
      // 3. Obtener notas de crédito relacionadas
      let notasCredito = [];
      skip = 0;
      continuarBusqueda = true;
  
      while (continuarBusqueda) {
        const notasCreditoUrl = `${serviceLayerUrl}PurchaseCreditNotes?$filter=CardCode eq '${cardCode}'&$select=DocTotal,DocumentLines&$skip=${skip}&$top=${top}`;
        const notasCreditoResponse = await makeAuthenticatedRequest(notasCreditoUrl, 'GET', null, sessionId);
        
        if (!notasCreditoResponse.value || notasCreditoResponse.value.length === 0) {
          continuarBusqueda = false;
          break;
        }
  
        // Filtrar notas de crédito relacionadas con las facturas de la orden
        const notasCreditoFiltradas = notasCreditoResponse.value.filter(nota => 
          nota.DocumentLines && nota.DocumentLines.some(linea => 
            docentriesFacturas.includes(linea.BaseEntry)
          )
        );
  
        notasCredito = notasCredito.concat(notasCreditoFiltradas);
  
        if (notasCreditoResponse.value.length < top) {
          continuarBusqueda = false;
        } else {
          skip += top;
        }
      }
  
      // 4. Calcular totales
      const totalFacturas = facturasAsociadas.reduce((sum, factura) => sum + factura.DocTotal, 0);
      
      // Calcular total de notas de crédito relacionadas
      const totalNotasCredito = notasCredito.reduce((sum, nota) => sum + nota.DocTotal, 0);
  
      const netoFacturado = totalFacturas - totalNotasCredito;
      const nuevoTotal = netoFacturado + totalNuevaFactura;
  
      // 5. Verificación y registro
      console.log('📊 Detalles de Verificación:');
      console.log(`- Total Orden de Compra: ${totalOrden}`);
      console.log(`- Total Facturas: ${totalFacturas}`);
      console.log(`- Total Notas de Crédito: ${totalNotasCredito}`);
      console.log(`- Neto Facturado: ${netoFacturado}`);
      console.log(`- Total Nueva Factura: ${totalNuevaFactura}`);
      console.log(`- Nuevo Total Acumulado: ${nuevoTotal}`);
  
      if (nuevoTotal > totalOrden) {
        throw new Error(`El total acumulado de facturas (${nuevoTotal}) excede el límite de la orden de compra (${totalOrden})`);
        return false;
  
      }
      console.log("✅ La nueva factura puede ser ingresada sin exceder el total de la orden de compra.");
      return true;
  
    } catch (error) {
      console.error("❌ Error al verificar el total de facturas:", error);
      throw error;
    }
  }


  export async function obtenerDocEntryDeOrdenCompra(ordenNro, sessionId) {
    console.log(`Obteniendo DocEntry para la orden de compra número ${ordenNro}...`);
    const url = `${serviceLayerUrl}PurchaseOrders?$filter=DocNum eq ${ordenNro}&$select=DocEntry`;
    try {
      const response = await makeAuthenticatedRequest(url, 'GET', null, sessionId);
      if (response.value && response.value.length > 0) {
        const docEntry = response.value[0].DocEntry;
        console.log(`DocEntry obtenido: ${docEntry}`);
        return docEntry;
      } else {
        throw new Error(`No se encontró la orden de compra con número ${ordenNro}`);
      }
    } catch (error) {
      console.error(`Error al obtener DocEntry de la orden de compra: ${error.message}`);
      throw error;
    }
  }

  function advancedTextComparison(text1, text2) {
    console.log("Realizando comparación avanzada de texto...");
    // Preprocesamiento de texto
    const preprocessText = (text) => {
      return tokenizer.tokenize(text.toLowerCase())
        .map(word => stemmer.stem(word))
        .filter(word => word.length > 2);
    };
  
    const tokens1 = preprocessText(text1);
    const tokens2 = preprocessText(text2);
  
    const uniqueTokens1 = new Set(tokens1);
    const uniqueTokens2 = new Set(tokens2);
  
    // Cálculo de similitud de Jaccard
    const intersection = new Set([...uniqueTokens1].filter(x => uniqueTokens2.has(x)));
    const jaccardSimilarity = intersection.size / (uniqueTokens1.size + uniqueTokens2.size - intersection.size);
  
    // Verificación de presencia de palabras clave
    const keywordsPresent = tokens2.some(token => uniqueTokens1.has(token));
  
    const result = jaccardSimilarity * 0.7 + (keywordsPresent ? 0.3 : 0);
    console.log(`Resultado de la comparación: ${result}`);
    return result;
  }


  function findBestMatch(invoiceDescription, poItems) {
    console.log(`🟢 Buscando la mejor coincidencia para: "${invoiceDescription}"`);
    let bestMatch = null;
    let bestScore = 0;
  
    for (const poItem of poItems) {
      const score = advancedTextComparison(invoiceDescription, poItem.ItemDescription);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...poItem, score };
      }
    }
  
    if (bestMatch) {
      console.log(`Mejor coincidencia encontrada: "${bestMatch.ItemDescription}" con puntuación ${bestMatch.score}`);
    } else {
      console.log("No se encontró ninguna coincidencia.");
    }
    return bestMatch;
  }

  export async function matchPurchaseOrderItems(invoiceItems, invoiceTotal, sessionId, ordenNro, purchaseOrder) {
    console.log("Iniciando emparejamiento de ítems de orden de compra...");
    const purchaseOrderNumber = ordenNro;
  
  
  
    // Obtención de los artículos de la orden de compra
    const poItems = purchaseOrder.value[0].DocumentLines;
    // console.log("Artículos de la orden de compra:", poItems);
    
    // Verificación de existencia de artículos en la orden de compra
    if (!poItems || poItems.length === 0) {
      throw new Error(`La orden de compra ${purchaseOrderNumber} no tiene líneas de items`);
    }
  
  
    const poTotal = purchaseOrder.value[0].DocTotal;
  
    const matchedItems = [];
    const unmatchedItems = [];
  
    // Verificación de coincidencia de totales
    const totalTolerance = 0.00;
    if (Math.abs(poTotal - invoiceTotal) > totalTolerance) {
      console.error(`El total de la factura (${invoiceTotal}) no coincide con el total de la orden de compra (${poTotal})`);
    }
     invoiceItems = Object.values(invoiceItems);
    // Proceso de emparejamiento de artículos
    console.log("Iniciando proceso de emparejamiento de artículos...");
    for (const invoiceItem of invoiceItems) {
      console.log(`Procesando ítem de factura: ${invoiceItem.descripcion}`);
      let matchedPOItem = null;
  
      // 1. Comparación por código
      matchedPOItem = poItems.find(poItem => poItem.ItemCode === invoiceItem.codigo);
      if (matchedPOItem) {
        console.log(`Coincidencia encontrada por código: ${matchedPOItem.ItemCode}`);
      }
  
      // 2. Comparación avanzada de texto si no hay coincidencia por código
      if (!matchedPOItem) {
        console.log("Realizando comparación avanzada de texto...");
        const bestMatch = findBestMatch(invoiceItem.descripcion, poItems);
        if (bestMatch && bestMatch.score > 0.5) { // Umbral ajustable
          matchedPOItem = bestMatch;
          console.log(`🟢 Coincidencia encontrada por descripción: ${matchedPOItem.ItemDescription} (Score: ${bestMatch.score})`);
        }
      }
  
      // 3. Comparación por precio unitario y total si aún no hay coincidencia
      if (!matchedPOItem) {
        console.log("Realizando comparación por precio...");
        const tolerance = 0.01; // Tolerancia configurable
        matchedPOItem = poItems.find(poItem => 
          Math.abs(poItem.UnitPrice - invoiceItem.precioUnidad) <= tolerance &&
          Math.abs(poItem.LineTotal - invoiceItem.importeItem) <= tolerance
        );
        if (matchedPOItem) {
          console.log(`Coincidencia encontrada por precio: ${matchedPOItem.ItemCode}`);
        }
      }
  
      // Registro de artículos emparejados y no emparejados
      if (matchedPOItem) {
        matchedItems.push({
          ...invoiceItem,
          ItemCode: matchedPOItem.ItemCode,
          matchMethod: matchedPOItem.ItemCode === invoiceItem.codigo ? 'code' : 
                       (matchedPOItem.score ? 'description' : 'price'),
          matchScore: matchedPOItem.score || null
        });
        console.log(`Ítem emparejado: ${invoiceItem.descripcion} con ${matchedPOItem.ItemCode}`);
      } else {
        unmatchedItems.push(invoiceItem);
        console.log(`Ítem no emparejado: ${invoiceItem.descripcion}`);
      }
    }
  
    console.log(`🟢 Emparejamiento completado. Ítems emparejados: ${matchedItems.length}, Ítems no emparejados: ${unmatchedItems.length}`);
    return { matchedItems, unmatchedItems, poTotal };
  }