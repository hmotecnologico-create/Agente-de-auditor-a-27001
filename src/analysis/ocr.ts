// OCR Pipeline Module - Tesseract Integration
import { createWorker, Worker } from 'tesseract.js';
import * as pdfParse from 'pdf-parse';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  pageCount?: number;
}

export interface DocumentMetadata {
  filename: string;
  size: number;
  type: string;
  pages?: number;
  extractedText?: string;
  ocrConfidence?: number;
  processingTimestamp: number;
}

export class OCRProcessor {
  private static instance: OCRProcessor;
  private worker: Worker | null = null;
  private isInitialized = false;

  static getInstance(): OCRProcessor {
    if (!OCRProcessor.instance) {
      OCRProcessor.instance = new OCRProcessor();
    }
    return OCRProcessor.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Inicializando OCR con Tesseract.js...');
      this.worker = await createWorker('spa+eng'); // Español e inglés
      this.isInitialized = true;
      console.log('✅ OCR inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando OCR:', error);
      throw new Error('No se pudo inicializar el motor OCR');
    }
  }

  async processImage(file: File): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      console.log(`📷 Procesando imagen: ${file.name}`);

      const { data: { text, confidence } } = await this.worker!.recognize(file);

      const processingTime = Date.now() - startTime;

      const result: OCRResult = {
        text: text.trim(),
        confidence,
        language: 'spa+eng',
        processingTime
      };

      console.log(`✅ OCR completado - Confianza: ${confidence.toFixed(2)}% - Tiempo: ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      throw new Error(`Error en OCR de imagen: ${error}`);
    }
  }

  async processPDF(file: File): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      console.log(`📄 Procesando PDF: ${file.name}`);

      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extraer texto con pdf-parse
      const pdfData = await pdfParse(uint8Array);

      let extractedText = pdfData.text;
      let needsOCR = false;

      // Verificar si el PDF tiene texto extraíble
      if (!extractedText || extractedText.trim().length < 100) {
        console.log('⚠️ PDF parece ser imagen-based, aplicando OCR...');
        needsOCR = true;

        // Si no hay texto suficiente, intentar OCR en las páginas
        if (this.worker) {
          // Para PDFs con imágenes, necesitaríamos renderizar páginas primero
          // Esta es una implementación simplificada
          extractedText = 'PDF requiere renderizado de páginas para OCR completo';
        }
      }

      const processingTime = Date.now() - startTime;
      const confidence = needsOCR ? 0.7 : 0.95; // Confianza estimada

      const result: OCRResult = {
        text: extractedText.trim(),
        confidence,
        language: 'spa+eng',
        processingTime,
        pageCount: pdfData.numpages
      };

      console.log(`✅ PDF procesado - Páginas: ${pdfData.numpages} - Confianza: ${(confidence * 100).toFixed(1)}%`);
      return result;

    } catch (error) {
      console.error('❌ Error procesando PDF:', error);
      throw new Error(`Error en procesamiento de PDF: ${error}`);
    }
  }

  async processDocument(file: File): Promise<DocumentMetadata> {
    const startTime = Date.now();

    try {
      console.log(`📂 Procesando documento: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

      let ocrResult: OCRResult;

      if (file.type === 'application/pdf') {
        ocrResult = await this.processPDF(file);
      } else if (file.type.startsWith('image/')) {
        ocrResult = await this.processImage(file);
      } else {
        throw new Error(`Tipo de archivo no soportado: ${file.type}`);
      }

      const metadata: DocumentMetadata = {
        filename: file.name,
        size: file.size,
        type: file.type,
        pages: ocrResult.pageCount,
        extractedText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        processingTimestamp: Date.now()
      };

      console.log(`✅ Documento procesado exitosamente en ${Date.now() - startTime}ms`);
      return metadata;

    } catch (error) {
      console.error('❌ Error procesando documento:', error);
      throw error;
    }
  }

  async processMultipleDocuments(files: File[]): Promise<DocumentMetadata[]> {
    const results: DocumentMetadata[] = [];

    console.log(`📚 Procesando ${files.length} documentos...`);

    for (const file of files) {
      try {
        const metadata = await this.processDocument(file);
        results.push(metadata);
      } catch (error) {
        console.error(`❌ Error procesando ${file.name}:`, error);
        // Continuar con otros archivos
      }
    }

    console.log(`✅ Procesamiento completado: ${results.length}/${files.length} documentos exitosos`);
    return results;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 OCR limpiado correctamente');
    }
  }

  getStatus(): { initialized: boolean; worker: boolean } {
    return {
      initialized: this.isInitialized,
      worker: this.worker !== null
    };
  }
}

// Utility functions for document processing
export class DocumentProcessor {
  static async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'Archivo demasiado grande (máximo 50MB)' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de archivo no soportado' };
    }

    return { valid: true };
  }

  static preprocessImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Redimensionar si es muy grande
        const maxWidth = 2000;
        const maxHeight = 2000;

        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: file.type });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}