import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { procesarFactura } from 'procesarFactura.js';

const app = express();
const port = process.env.PORT || 3000;

// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Función para eliminar el archivo
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error al eliminar el archivo:', err);
    } else {
      console.log('Archivo eliminado con éxito:', filePath);
    }
  });
}

// Ruta para procesar la factura
app.post('/api/process-invoice', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }

  const filePath = req.file.path;
  const ordenNro = req.body.ordenNro || null;

  try {
    const result = await procesarFactura(filePath, ordenNro);
    
    // Eliminar el archivo después de procesarlo
    deleteFile(filePath);
    
    res.json(result);
  } catch (error) {
    console.error('Error al procesar la factura:', error);
    
    // Eliminar el archivo incluso si hubo un error en el procesamiento
    deleteFile(filePath);
    
    res.status(500).json({ error: 'Error al procesar la factura', details: error.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});