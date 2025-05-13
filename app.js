/**
 * Servidor Express principal para el procesamiento de facturas
 * Maneja la carga de archivos de facturas, configura el almacenamiento temporal,
 * y coordina el procesamiento de facturas a través de la API REST.
 * Incluye configuración de CORS y manejo de errores para subida de archivos.
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { procesarFactura } from './procesarFactura.js';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar multer para guardar en la carpeta "entrenamiento"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'entrenamiento/')
  },
  filename: function (req, file, cb) {
    const files = fs.readdirSync('entrenamiento/');
    const count = files.length + 1;
    const filename = `factura${count}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static('frontend'));

app.post('/api/process-invoice', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    try {
        const result = await procesarFactura(req.file.path);
        res.json(result);
        // No eliminamos el archivo aquí, ya que queremos mantener el WebP
    } catch (error) {
        console.error('Error al procesar la factura:', error);
        res.status(500).json({ error: 'Error al procesar la factura' });
        // Eliminamos el archivo original si hubo un error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    }
});

const PORT = process.env.PORT || 3800;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});