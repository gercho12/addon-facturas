For the English version of this document, please see [README.md](README.md).

# Título del Proyecto

## Introducción/Resumen

Este proyecto automatiza el procesamiento de facturas de proveedores. Recibe facturas por correo electrónico o mediante una API de carga manual, extrae datos utilizando IA, valida los datos (por ejemplo, contra AFIP para la localización argentina), se integra con SAP Business One (por ejemplo, creando facturas de compra, búsquedas de proveedores) y notifica a los usuarios sobre el resultado del procesamiento. El objetivo es optimizar el proceso de cuentas por pagar, reduciendo el esfuerzo manual y los errores.

## Funcionalidades Principales

*   **Monitoreo Automatizado de Correo Electrónico:**
    *   El sistema escucha una cuenta de correo electrónico designada para correos entrantes con facturas adjuntas.
    *   Se extrae información relevante (archivo de factura, número de orden de compra si se menciona, correo electrónico del remitente) para su procesamiento.
*   **API de Carga Manual de Facturas:**
    *   Proporciona un punto final HTTP (`/api/process-invoice`) para enviar facturas manualmente.
    *   Útil para probar o procesar facturas no recibidas por correo electrónico.
*   **Extracción de Datos Potenciada por IA:**
    *   Utiliza IA Generativa de Google para analizar documentos de facturas (imágenes o PDF).
    *   Extrae puntos de datos clave como CUIT, número de factura, fechas, montos, artículos, etc.
    *   Incluye pasos de preprocesamiento como optimización de imágenes y extracción de texto (OCR para imágenes, extracción de texto para PDF).
*   **Validación AFIP (Argentina):**
    *   Realiza la validación de facturas contra los servicios web de AFIP (Administración Federal de Ingresos Públicos de Argentina) para garantizar el cumplimiento y la validez.
*   **Integración con SAP Business One:**
    *   Se conecta a SAP Business One a través de la Service Layer.
    *   Verifica la existencia del proveedor (Socio de Negocio) según el CUIT.
    *   Recupera detalles de la Orden de Compra de SAP.
    *   Compara los artículos de la factura con los artículos de la Orden de Compra.
    *   Crea Facturas de Proveedores en SAP.
*   **Optimización de Imágenes:**
    *   Convierte varios formatos de imagen a WebP.
    *   Optimiza imágenes (redimensionamiento, escala de grises, ajustes de contraste/brillo, nitidez) para mejorar la precisión del procesamiento de IA y reducir el tamaño del archivo.
*   **Notificaciones por Correo Electrónico:**
    *   Envía notificaciones por correo electrónico a destinatarios designados (por ejemplo, correo electrónico del cliente, remitente original) sobre el estado del procesamiento de la factura.
    *   Indica éxito o fracaso, incluyendo detalles del error si aplica.
*   **Registro Integral (Logging):**
    *   Registro detallado durante todo el proceso, incluidas las interacciones con IA, SAP y otros servicios.
    *   Ayuda en el monitoreo y la resolución de problemas.

## Tecnologías Utilizadas

**Entorno de Ejecución:**
*   Node.js (>=18.0.0)

**Lenguaje de Programación:**
*   JavaScript (Módulos ES)

**Bibliotecas y Frameworks Clave:**
*   `@google/generative-ai`: Biblioteca cliente para la IA Generativa de Google.
*   `express`: Framework de servidor web (para API).
*   `dotenv`: Carga variables de entorno desde un archivo `.env`.
*   `node-fetch`: Para realizar solicitudes HTTP (utilizado para SAP Service Layer, AFIP, etc.).
*   `sharp`: Procesamiento de imágenes de alto rendimiento.
*   `tesseract.js`: Biblioteca OCR para extracción de texto de imágenes.
*   `pdf-parse`: Extracción de texto de PDF.
*   `mailparser`: Para analizar mensajes de correo electrónico.
*   `node-imap`: Para conectarse a servidores de correo electrónico IMAP.
*   `multer`: Middleware para manejar la carga de archivos.
*   `easy-soap-request`: Para realizar solicitudes SOAP (probablemente para AFIP WSAA).
*   `xml2js`: Convertidor de XML a objeto JavaScript (y viceversa).
*   `natural`: Utilidades de procesamiento de lenguaje natural.

**Servicios Externos / Plataformas:**
*   SAP Business One Service Layer: Para integración con ERP.
*   Servicios Web de AFIP: Para validación de facturas argentinas (incluyendo WSAA para autenticación).
*   Google AI Platform: Para acceder a modelos de IA generativa.

**Herramientas de Desarrollo:**
*   `nodemon`: Monitorea cambios y reinicia automáticamente el servidor durante el desarrollo.

## Prerrequisitos

*   **Node.js:** Versión 18.0.0 o superior. (npm se incluye con Node.js). Puede descargarlo desde [https://nodejs.org/](https://nodejs.org/).
*   **Cuenta de Correo Electrónico IMAP:** Credenciales (host, usuario, contraseña, puerto) para la cuenta de correo electrónico que el sistema monitoreará en busca de facturas.
*   **Acceso a SAP Business One:**
    *   Acceso a un punto final de SAP Business One Service Layer.
    *   Credenciales de usuario válidas (nombre de usuario, contraseña) para SAP B1.
    *   El nombre de la Base de Datos de la Compañía.
*   **Cuenta de Google Cloud Platform:**
    *   Un proyecto de Google Cloud con la API Vertex AI (o la API de IA Generativa específica utilizada) habilitada.
    *   Una Clave API para autenticar solicitudes a los servicios de Google AI.
*   **Credenciales de AFIP (para localización argentina):**
    *   CUIT (Clave Única de Identificación Tributaria) de la empresa.
    *   Un certificado digital (archivo `.pfx`) y su contraseña correspondiente para WSAA (Web Service de Autenticación y Autorización) para interactuar con los servicios de AFIP.
    *   Asegúrese de que el CUIT esté autorizado para utilizar los servicios web relevantes de AFIP (por ejemplo, consulta de factura electrónica).
*   **Git (Opcional):** Para clonar el repositorio desde el control de versiones.

## Instalación

1.  **Clonar el repositorio (si aún no lo ha hecho):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    *(Reemplace `<repository-url>` con la URL real del repositorio y `<repository-directory>` con el nombre de la carpeta creada por git clone).*

2.  **Instalar dependencias:**
    Navegue al directorio raíz del proyecto en su terminal y ejecute:
    ```bash
    npm install
    ```
    Este comando descargará e instalará todos los paquetes necesarios definidos en el archivo `package.json`.

## Configuración

1.  **Crear un archivo `.env`:**
    En el directorio raíz del proyecto, cree un archivo llamado `.env`. Este archivo almacenará todas sus configuraciones específicas del entorno.

2.  **Poblar el archivo `.env`:**
    Agregue las siguientes variables a su archivo `.env`, reemplazando los valores de marcador de posición con sus detalles de configuración reales. Las líneas que comienzan con `#` son comentarios.

    ```dotenv
    # --- Configuración de Google AI ---
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    AI_MODEL=gemini-pro-vision # O su modelo de Google AI preferido

    # --- Configuración de SAP Business One ---
    SERVICE_LAYER=https://your-sap-server:port/b1s/v1/
    BASE_DE_DATOS=YOUR_SAP_COMPANY_DB
    USUARIO=YOUR_SAP_USERNAME
    PASSWORD=YOUR_SAP_PASSWORD

    # --- Configuración de Correo Electrónico (IMAP para escuchar, SMTP para enviar) ---
    IMAP_USER=your_email@example.com
    IMAP_PASSWORD=your_email_password
    IMAP_HOST=imap.example.com
    IMAP_PORT=993
    SMTP_PORT=587 # Opcional, por defecto 587 si no se establece

    # --- Correo Electrónico Específico de la Aplicación ---
    # Dirección de correo electrónico para enviar notificaciones de estado del procesamiento (éxito/fracaso)
    EMAIL_CLIENTE=client_email@example.com

    # --- Configuración del Servidor ---
    PORT=3000 # Opcional, puerto para el servidor API, por defecto 3000

    # --- Configuración de AFIP (Argentina) ---
    # CUIT de la empresa que realiza las solicitudes a AFIP (el representado en el certificado)
    AFIP_CUIT_REPRESENTADO=YOUR_COMPANY_CUIT
    # Ruta completa al archivo de certificado .pfx de AFIP
    AFIP_CERT_PATH=C:/path/to/your/CERTSOL.pfx
    # Contraseña para el certificado .pfx de AFIP
    AFIP_CERT_PASSWORD=YOUR_CERTIFICATE_PASSWORD

    # --- Rutas para scripts WSAA y respuestas AFIP ---
    # IMPORTANTE: Asegúrese de que estas rutas estén configuradas correctamente para su entorno.
    # Ruta al script de PowerShell para autenticación WSAA de AFIP (wsaa-cliente.ps1)
    WSAA_SCRIPT_PATH=C:/path/to/wsaa-cliente.ps1
    # Ruta donde se almacena el XML de respuesta de AFIP WSAA (response-log.xml)
    WSAA_RESPONSE_XML_PATH=C:/path/to/response-log.xml

    # --- Rutas del Sistema de Archivos ---
    # Directorio para cargas temporales de archivos por el servidor API
    UPLOADS_DIR=uploads/
    # Directorio para almacenar archivos adjuntos de facturas procesadas desde correos electrónicos
    ADJUNTOS_FACTURAS_DIR=adjuntos_facturas/
    ```

3.  **Notas Importantes sobre la Configuración de AFIP:**
    *   La implementación actual para la autenticación de AFIP (`executeWSAA.js` y su uso en `validarFactura.js`) implica rutas y credenciales codificadas (por ejemplo, contraseña PFX, CUIT para solicitudes, rutas a scripts).
    *   Se **recomienda encarecidamente** modificar los scripts (`validarFactura.js`, `executeWSAA.js`) para utilizar las variables de entorno `AFIP_CUIT_REPRESENTADO`, `AFIP_CERT_PATH`, `AFIP_CERT_PASSWORD`, `WSAA_SCRIPT_PATH` y `WSAA_RESPONSE_XML_PATH` en lugar de valores codificados. Esto mejora la seguridad y la configurabilidad.
    *   Asegúrese de que el script de PowerShell `wsaa-cliente.ps1` esté correctamente configurado y funcionando de forma independiente antes de ejecutar las funciones de AFIP de la aplicación. Se le pasan los parámetros de ruta del script, ruta del certificado y contraseña del certificado.

4.  **Asegurar que `.env` esté en `.gitignore`:**
    Para evitar confirmar accidentalmente sus credenciales sensibles, asegúrese de que el archivo `.env` esté listado en su archivo `.gitignore`. Si no, agréguelo:
    ```
    .env
    ```

## Ejecutando la Aplicación

La aplicación consta de dos servicios principales que se pueden ejecutar de forma independiente:

### Escuchador de Correo Electrónico
Este servicio monitorea la cuenta de correo electrónico IMAP configurada, procesa los correos electrónicos entrantes con facturas y activa el flujo de trabajo de procesamiento de facturas.

Para iniciar el escuchador de correo electrónico:
```bash
node index.js
```
Debería ver registros en la consola que indican que el servidor se ha iniciado y está escuchando nuevos correos electrónicos.

### Servidor API
Este servicio proporciona una API HTTP para cargar y procesar facturas manualmente.

Para iniciar el servidor API:
```bash
node server.js
```
Por defecto, el servidor se iniciará en el puerto especificado en su archivo `.env` (o el puerto 3000 si no se especifica). Debería ver un registro en la consola como `Servidor escuchando en http://localhost:3000`.

**Modo de Desarrollo (usando `nodemon` para el Servidor API):**
Si tiene `nodemon` instalado (está listado en `devDependencies`), puede ejecutar el servidor API en modo de desarrollo. Esto reiniciará automáticamente el servidor cuando se detecten cambios en los archivos.
```bash
npm run dev
```
*(Esto supone que el script `dev` en `package.json` es `nodemon server.js` o similar).*

**Nota:**
*   Asegúrese de que todas las configuraciones en el archivo `.env` estén correctamente establecidas antes de ejecutar la aplicación.
*   Ambos servicios se pueden ejecutar simultáneamente en sesiones de terminal separadas si es necesario.

## Estructura del Proyecto

```
.
├── adjuntos_facturas/  # Directorio predeterminado para almacenar archivos adjuntos de facturas de correos electrónicos
├── entrenamiento/        # Contiene facturas de muestra para entrenar/probar modelos de IA
├── wsaa/                 # Contiene archivos relacionados con la autenticación WSAA de AFIP (certificados, scripts)
├── .env                  # Variables de entorno (debe estar en .gitignore)
├── .gitattributes        # Configuración de atributos de Git
├── .gitignore            # Especifica archivos no rastreados intencionalmente que Git debe ignorar
├── contexto.js           # Contiene contexto/ejemplos para el modelo de IA (por ejemplo, datos de factura de muestra)
├── eng.traineddata       # Datos de idioma de Tesseract para OCR en inglés
├── spa.traineddata       # Datos de idioma de Tesseract para OCR en español
├── enviarCorreo.js       # Módulo para enviar notificaciones por correo electrónico
├── escucharCorreos.js    # Módulo para escuchar una cuenta de correo electrónico IMAP en busca de nuevas facturas
├── executeWSAA.js        # Módulo para ejecutar scripts de autenticación WSAA de AFIP
├── funcionesOC.js        # Funciones relacionadas con el procesamiento de Órdenes de Compra (OC) en SAP
├── index.js              # Punto de entrada principal para el servicio de escucha de correo electrónico
├── package-lock.json     # Registra versiones exactas de las dependencias
├── package.json          # Metadatos del proyecto, dependencias y scripts
├── procesamientoAi.js    # Módulo para interactuar con IA Generativa de Google para la extracción de datos de facturas
├── procesarFactura.js    # Módulo central que orquesta el flujo de trabajo de procesamiento de facturas
├── server.js             # Punto de entrada para el servidor API Express (carga manual de facturas)
├── validarFactura.js     # Módulo para validar facturas con los servicios web de AFIP
└── README.md             # Este archivo - documentación del proyecto
```

**Explicaciones Clave de Archivos/Directorios:**

*   **`index.js`**: Punto de entrada principal de la aplicación para el servicio de escucha de correo electrónico. Inicializa `escucharCorreos.js` para monitorear una bandeja de entrada de correo electrónico y `procesarFactura.js` para manejar las facturas entrantes.
*   **`server.js`**: Configura un servidor web Express.js que proporciona un punto final API (`/api/process-invoice`) para cargar y procesar facturas manualmente.
*   **`procesarFactura.js`**: El orquestador central para la lógica de procesamiento de facturas. Integra varios módulos para la extracción de datos de IA, comunicación con SAP, validación de AFIP y notificaciones por correo electrónico.
*   **`procesamientoAi.js`**: Maneja todas las interacciones con el modelo de IA Generativa de Google, incluida la preparación de datos, el envío de solicitudes y el análisis de respuestas. Utiliza `contexto.js` para proporcionar ejemplos a la IA.
*   **`escucharCorreos.js`**: Se conecta a un servidor de correo electrónico IMAP, escucha nuevos correos electrónicos, los analiza, extrae archivos adjuntos y los guarda en `adjuntos_facturas/`.
*   **`enviarCorreo.js`**: Responsable de enviar notificaciones por correo electrónico (por ejemplo, mensajes de éxito o fracaso) utilizando nodemailer.
*   **`validarFactura.js`**: Interactúa con los servicios web de AFIP para validar facturas electrónicas. Utiliza `executeWSAA.js` para la autenticación.
*   **`executeWSAA.js`**: Gestiona la ejecución de scripts externos (por ejemplo, PowerShell) para obtener tokens de autenticación (Token y Sign) del servicio WSAA de AFIP.
*   **`funcionesOC.js`**: Contiene funciones de ayuda para operaciones relacionadas con Órdenes de Compra (OC) de SAP Business One, como obtener datos de OC y comparar artículos.
*   **`contexto.js`**: Proporciona ejemplos de pocas interacciones (few-shot) o instrucciones del sistema (por ejemplo, estructuras de factura de muestra y salidas JSON esperadas) para guiar las respuestas del modelo de IA.
*   **`wsaa/`**: Directorio destinado a contener archivos relacionados con WSAA (Web Service de Autenticación y Autorización) de AFIP, como certificados digitales (`.pfx`) y el script de PowerShell (`wsaa-cliente.ps1`) para obtener tokens de autenticación.
*   **`adjuntos_facturas/`**: Directorio predeterminado donde se almacenan los archivos adjuntos de las facturas recuperados de los correos electrónicos antes y durante el procesamiento.
*   **`entrenamiento/`**: Contiene archivos de factura de muestra (imágenes, PDF) que se pueden utilizar para entrenar, ajustar o probar los modelos de extracción de datos de IA.
*   **`*.traineddata`**: Archivos de idioma para el motor OCR Tesseract (por ejemplo, `spa.traineddata` para español).
*   **`.env`**: Almacena variables de configuración específicas del entorno (claves API, credenciales de base de datos, etc.). **Este archivo no debe confirmarse en el control de versiones.**
*   **`package.json`**: Define los metadatos del proyecto, enumera las dependencias e incluye scripts para ejecutar, probar y desarrollar la aplicación.

## Puntos Finales de la API

## Manejo de Errores y Registro

## Solución de Problemas

## Puntos Finales de la API

*(Esta sección necesitaría ser completada con la documentación real de los puntos finales de la API, si existen. Ejemplo:)*

*   **`POST /api/process-invoice`**: Permite la carga manual de un archivo de factura para su procesamiento.
    *   **Cuerpo de la Solicitud:** `multipart/form-data` con un campo de archivo (por ejemplo, `invoiceFile`).
    *   **Respuesta de Éxito (200 OK):** Mensaje indicando que la factura está siendo procesada.
    *   **Respuesta de Error:** Detalles del error.

## Manejo de Errores y Registro

*   **Manejo de Errores:** La aplicación debe incluir mecanismos robustos de manejo de errores para cada módulo (IA, SAP, AFIP, correo electrónico). Los errores deben ser capturados y registrados adecuadamente.
*   **Registro (Logging):** Se utiliza un sistema de registro detallado para rastrear el flujo del proceso de la factura. Los registros deben incluir:
    *   Recepción de correos electrónicos/cargas de API.
    *   Interacciones con el servicio de IA (solicitudes, respuestas, errores).
    *   Interacciones con SAP Business One (solicitudes, respuestas, errores).
    *   Validaciones de AFIP (resultados, errores).
    *   Notificaciones por correo electrónico enviadas.
    *   Errores generales de la aplicación.
    *   Los registros deben tener marcas de tiempo y niveles de severidad (INFO, ERROR, DEBUG).

## Solución de Problemas

*   **Verificar el archivo `.env`:** Asegúrese de que todas las variables de entorno estén configuradas correctamente y que el archivo `.env` esté en el directorio raíz.
*   **Consultar los Registros:** Revise los archivos de registro (o la salida de la consola) para obtener mensajes de error detallados.
*   **Conectividad de Red:**
    *   Asegúrese de que el servidor pueda acceder a los servicios de Google AI.
    *   Verifique la conectividad con el Service Layer de SAP Business One.
    *   Asegúrese de que se pueda acceder a los servicios web de AFIP.
    *   Confirme la configuración correcta de IMAP/SMTP para el servidor de correo.
*   **Dependencias:** Asegúrese de que todas las dependencias de Node.js estén instaladas correctamente (`npm install`).
*   **Script WSAA de AFIP:** Pruebe el script `wsaa-cliente.ps1` de forma independiente para confirmar que puede obtener los tokens de autenticación de AFIP. Verifique las rutas de los certificados y las contraseñas.
*   **Permisos de Archivos/Directorios:** Asegúrese de que la aplicación tenga permisos de escritura para los directorios `adjuntos_facturas/` y `uploads/`.

## Contribuciones

Las contribuciones son bienvenidas. Si desea contribuir, por favor:
1.  Haga un fork del repositorio.
2.  Cree una nueva rama para sus características o correcciones (`git checkout -b feature/nueva-caracteristica` o `git checkout -b fix/error-corregido`).
3.  Realice sus cambios y haga commit (`git commit -am 'Agregar nueva característica'`).
4.  Envíe sus cambios a la rama (`git push origin feature/nueva-caracteristica`).
5.  Cree un nuevo Pull Request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo `LICENSE` (si existe) para obtener más detalles.
*(Si no hay un archivo LICENSE, se puede agregar uno o especificar los términos de la licencia aquí).*
