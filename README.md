Para la versión en español de este documento, por favor consulta [README_es.md](README_es.md).

# Project Title

## Introduction/Overview

This project automates the processing of supplier invoices. It receives invoices through email or a manual upload API, extracts data using AI, validates the data (e.g., against AFIP for Argentinian localization), integrates with SAP Business One (e.g., creating purchase invoices, supplier lookups), and notifies users about the processing outcome. The goal is to streamline the accounts payable process, reducing manual effort and errors.

## Core Functionalities

*   **Automated Email Monitoring:**
    *   The system listens to a designated email account for incoming emails with attached invoices.
    *   Relevant information (invoice file, purchase order number if mentioned, sender's email) is extracted for processing.
*   **Manual Invoice Upload API:**
    *   Provides an HTTP endpoint (`/api/process-invoice`) for manually submitting invoices.
    *   Useful for testing or processing invoices not received via email.
*   **AI-Powered Data Extraction:**
    *   Utilizes Google Generative AI to analyze invoice documents (images or PDFs).
    *   Extracts key data points such as CUIT, invoice number, dates, amounts, items, etc.
    *   Includes pre-processing steps like image optimization and text extraction (OCR for images, text extraction for PDFs).
*   **AFIP Validation (Argentina):**
    *   Performs validation of invoices against AFIP (Argentinian tax authority) web services to ensure compliance and validity.
*   **SAP Business One Integration:**
    *   Connects to SAP Business One via the Service Layer.
    *   Verifies supplier existence (Business Partner) based on CUIT.
    *   Retrieves Purchase Order details from SAP.
    *   Matches invoice items with Purchase Order items.
    *   Creates Purchase Invoices (Facturas de Proveedores) in SAP.
*   **Image Optimization:**
    *   Converts various image formats to WebP.
    *   Optimizes images (resizing, grayscale, contrast/brightness adjustments, sharpening) to improve AI processing accuracy and reduce file size.
*   **Email Notifications:**
    *   Sends email notifications to designated recipients (e.g., client's email, original sender) about the status of invoice processing.
    *   Indicates success or failure, including error details if applicable.
*   **Comprehensive Logging:**
    *   Detailed logging throughout the process, including interactions with AI, SAP, and other services.
    *   Helps in monitoring and troubleshooting.

## Technologies Used

**Runtime Environment:**
*   Node.js (>=18.0.0)

**Programming Language:**
*   JavaScript (ES Modules)

**Key Libraries & Frameworks:**
*   `@google/generative-ai`: Client library for Google's Generative AI.
*   `express`: Web server framework (for API).
*   `dotenv`: Loads environment variables from a `.env` file.
*   `node-fetch`: For making HTTP requests (used for SAP Service Layer, AFIP, etc.).
*   `sharp`: High-performance image processing.
*   `tesseract.js`: OCR library for image-to-text extraction.
*   `pdf-parse`: PDF text extraction.
*   `mailparser`: For parsing email messages.
*   `node-imap`: For connecting to IMAP email servers.
*   `multer`: Middleware for handling file uploads.
*   `easy-soap-request`: For making SOAP requests (likely for AFIP WSAA).
*   `xml2js`: XML to JavaScript object converter (and vice-versa).
*   `natural`: Natural language processing utilities.

**External Services / Platforms:**
*   SAP Business One Service Layer: For ERP integration.
*   AFIP Web Services: For Argentinian invoice validation (including WSAA for authentication).
*   Google AI Platform: For accessing generative AI models.

**Development Tools:**
*   `nodemon`: Monitors for changes and automatically restarts the server during development.

## Prerequisites

*   **Node.js:** Version 18.0.0 or higher. (npm is included with Node.js). You can download it from [https://nodejs.org/](https://nodejs.org/).
*   **IMAP Email Account:** Credentials (host, user, password, port) for the email account the system will monitor for invoices.
*   **SAP Business One Access:**
    *   Access to an SAP Business One Service Layer endpoint.
    *   Valid user credentials (username, password) for SAP B1.
    *   The Company Database name.
*   **Google Cloud Platform Account:**
    *   A Google Cloud project with the Vertex AI API (or the specific Generative AI API used) enabled.
    *   An API Key for authenticating requests to the Google AI services.
*   **AFIP Credentials (for Argentinian localization):**
    *   CUIT (Clave Única de Identificación Tributaria) of the company.
    *   A digital certificate (`.pfx` file) and its corresponding password for WSAA (Web Service de Autenticación y Autorización) to interact with AFIP services.
    *   Ensure the CUIT is authorized to use the relevant AFIP web services (e.g., electronic invoice consultation).
*   **Git (Optional):** For cloning the repository from version control.

## Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    *(Replace `<repository-url>` with the actual URL of the repository and `<repository-directory>` with the name of the folder created by git clone).*

2.  **Install dependencies:**
    Navigate to the project's root directory in your terminal and run:
    ```bash
    npm install
    ```
    This command will download and install all the necessary packages defined in the `package.json` file.

## Configuration

1.  **Create a `.env` file:**
    In the root directory of the project, create a file named `.env`. This file will store all your environment-specific configurations.

2.  **Populate the `.env` file:**
    Add the following variables to your `.env` file, replacing the placeholder values with your actual configuration details. Lines starting with `#` are comments.

    ```dotenv
    # --- Google AI Configuration ---
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    AI_MODEL=gemini-pro-vision # Or your preferred Google AI model

    # --- SAP Business One Configuration ---
    SERVICE_LAYER=https://your-sap-server:port/b1s/v1/
    BASE_DE_DATOS=YOUR_SAP_COMPANY_DB
    USUARIO=YOUR_SAP_USERNAME
    PASSWORD=YOUR_SAP_PASSWORD

    # --- Email Configuration (IMAP for listening, SMTP for sending) ---
    IMAP_USER=your_email@example.com
    IMAP_PASSWORD=your_email_password
    IMAP_HOST=imap.example.com
    IMAP_PORT=993
    SMTP_PORT=587 # Optional, defaults to 587 if not set

    # --- Application Specific Email ---
    # Email address to send processing status notifications (success/failure)
    EMAIL_CLIENTE=client_email@example.com

    # --- Server Configuration ---
    PORT=3000 # Optional, port for the API server, defaults to 3000

    # --- AFIP Configuration (Argentina) ---
    # CUIT of the company making AFIP requests (the one represented in the certificate)
    AFIP_CUIT_REPRESENTADO=YOUR_COMPANY_CUIT
    # Full path to the AFIP .pfx certificate file
    AFIP_CERT_PATH=C:/path/to/your/CERTSOL.pfx
    # Password for the AFIP .pfx certificate
    AFIP_CERT_PASSWORD=YOUR_CERTIFICATE_PASSWORD

    # --- Paths for WSAA scripts and AFIP responses ---
    # IMPORTANT: Ensure these paths are correctly set for your environment.
    # Path to the PowerShell script for AFIP WSAA authentication (wsaa-cliente.ps1)
    WSAA_SCRIPT_PATH=C:/path/to/wsaa-cliente.ps1
    # Path where the AFIP WSAA response XML (response-log.xml) is stored
    WSAA_RESPONSE_XML_PATH=C:/path/to/response-log.xml

    # --- File System Paths ---
    # Directory for temporary file uploads by the API server
    UPLOADS_DIR=uploads/
    # Directory for storing invoice attachments processed from emails
    ADJUNTOS_FACTURAS_DIR=adjuntos_facturas/
    ```

3.  **Important Notes on AFIP Configuration:**
    *   The current implementation for AFIP authentication (`executeWSAA.js` and its usage in `validarFactura.js`) involves hardcoded paths and credentials (e.g., PFX password, CUIT for requests, paths to scripts).
    *   It is **strongly recommended** to modify the scripts (`validarFactura.js`, `executeWSAA.js`) to use the environment variables `AFIP_CUIT_REPRESENTADO`, `AFIP_CERT_PATH`, `AFIP_CERT_PASSWORD`, `WSAA_SCRIPT_PATH`, and `WSAA_RESPONSE_XML_PATH` instead of hardcoded values. This improves security and configurability.
    *   Ensure the PowerShell script `wsaa-cliente.ps1` is correctly configured and functioning independently before running the application's AFIP features. The script path, certificate path, and certificate password parameters are passed to it.

4.  **Ensure `.env` is in `.gitignore`:**
    To prevent accidentally committing your sensitive credentials, make sure the `.env` file is listed in your `.gitignore` file. If not, add it:
    ```
    .env
    ```

## Running the Application

The application consists of two main services that can be run independently:

### Email Listener
This service monitors the configured IMAP email account, processes incoming emails with invoices, and triggers the invoice processing workflow.

To start the email listener:
```bash
node index.js
```
You should see logs in the console indicating that the server has started and is listening for new emails.

### API Server
This service provides an HTTP API for manually uploading and processing invoices.

To start the API server:
```bash
node server.js
```
By default, the server will start on the port specified in your `.env` file (or port 3000 if not specified). You should see a log in the console like `Servidor escuchando en http://localhost:3000`.

**Development Mode (using `nodemon` for API Server):**
If you have `nodemon` installed (it's listed in `devDependencies`), you can run the API server in development mode. This will automatically restart the server when file changes are detected.
```bash
npm run dev
```
*(This assumes the `dev` script in `package.json` is `nodemon server.js` or similar).*

**Note:**
*   Ensure all configurations in the `.env` file are correctly set before running the application.
*   Both services can be run concurrently in separate terminal sessions if needed.

## Project Structure

```
.
├── adjuntos_facturas/  # Default directory for storing invoice attachments from emails
├── entrenamiento/        # Contains sample invoices for training/testing AI models
├── wsaa/                 # Contains files related to AFIP WSAA authentication (certs, scripts)
├── .env                  # Environment variables (should be in .gitignore)
├── .gitattributes        # Git attributes configuration
├── .gitignore            # Specifies intentionally untracked files that Git should ignore
├── contexto.js           # Contains context/examples for the AI model (e.g., sample invoice data)
├── eng.traineddata       # Tesseract language data for English OCR
├── spa.traineddata       # Tesseract language data for Spanish OCR
├── enviarCorreo.js       # Module for sending email notifications
├── escucharCorreos.js    # Module for listening to an IMAP email account for new invoices
├── executeWSAA.js        # Module for executing AFIP WSAA authentication scripts
├── funcionesOC.js        # Functions related to Purchase Order (OC) processing in SAP
├── index.js              # Main entry point for the email listening service
├── package-lock.json     # Records exact versions of dependencies
├── package.json          # Project metadata, dependencies, and scripts
├── procesamientoAi.js    # Module for interacting with Google Generative AI for invoice data extraction
├── procesarFactura.js    # Core module orchestrating the invoice processing workflow
├── server.js             # Entry point for the Express API server (manual invoice upload)
├── validarFactura.js     # Module for validating invoices with AFIP web services
└── README.md             # This file - project documentation
```

**Key File/Directory Explanations:**

*   **`index.js`**: Main application entry point for the email listening service. It initializes `escucharCorreos.js` to monitor an email inbox and `procesarFactura.js` to handle incoming invoices.
*   **`server.js`**: Sets up an Express.js web server that provides an API endpoint (`/api/process-invoice`) for manually uploading and processing invoices.
*   **`procesarFactura.js`**: The central orchestrator for the invoice processing logic. It integrates various modules for AI data extraction, SAP communication, AFIP validation, and email notifications.
*   **`procesamientoAi.js`**: Handles all interactions with the Google Generative AI model, including preparing data, sending requests, and parsing responses. It uses `contexto.js` for providing examples to the AI.
*   **`escucharCorreos.js`**: Connects to an IMAP email server, listens for new emails, parses them, extracts attachments, and saves them to `adjuntos_facturas/`.
*   **`enviarCorreo.js`**: Responsible for sending email notifications (e.g., success or failure messages) using nodemailer.
*   **`validarFactura.js`**: Interacts with AFIP web services to validate electronic invoices. It uses `executeWSAA.js` for authentication.
*   **`executeWSAA.js`**: Manages the execution of external scripts (e.g., PowerShell) to obtain authentication tokens (Token and Sign) from AFIP's WSAA service.
*   **`funcionesOC.js`**: Contains helper functions for SAP Business One Purchase Order (OC) related operations, such as fetching OC data and matching items.
*   **`contexto.js`**: Provides few-shot examples or system instructions (e.g., sample invoice structures and expected JSON outputs) to guide the AI model's responses.
*   **`wsaa/`**: Directory intended to hold AFIP WSAA (Web Service de Autenticación y Autorización) related files, such as digital certificates (`.pfx`) and the PowerShell script (`wsaa-cliente.ps1`) for obtaining authentication tokens.
*   **`adjuntos_facturas/`**: Default directory where invoice attachments retrieved from emails are stored before and during processing.
*   **`entrenamiento/`**: Contains sample invoice files (images, PDFs) that can be used for training, fine-tuning, or testing the AI data extraction models.
*   **`*.traineddata`**: Language files for Tesseract OCR engine (e.g., `spa.traineddata` for Spanish).
*   **`.env`**: Stores environment-specific configuration variables (API keys, database credentials, etc.). **This file should not be committed to version control.**
*   **`package.json`**: Defines project metadata, lists dependencies, and includes scripts for running, testing, and developing the application.

## API Endpoints

## Error Handling and Logging

## Troubleshooting

## Contributing

## License
