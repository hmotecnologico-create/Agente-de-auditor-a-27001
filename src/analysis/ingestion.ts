// Document Ingestion Pipeline - Real Document Processing
import { OCRProcessor, DocumentProcessor, DocumentMetadata } from './ocr';
import { LocalLLMManager, AuditLLMAgent } from './local-llm';
import { BM25SearchEngine, FAISSSearchEngine, SearchEngineBenchmark, SearchResult } from './search';

export interface ProcessedDocument {
  id: string;
  metadata: DocumentMetadata;
  content: {
    rawText: string;
    processedText: string;
    entities: Record<string, string[]>;
    summary: string;
    keyPhrases: string[];
  };
  compliance: {
    relevantStandards: string[];
    extractedControls: string[];
    riskIndicators: string[];
  };
  processing: {
    timestamp: number;
    processingTime: number;
    ocrConfidence: number;
    llmConfidence: number;
  };
}

export interface IngestionResult {
  documents: ProcessedDocument[];
  statistics: {
    totalProcessed: number;
    successful: number;
    failed: number;
    totalProcessingTime: number;
    averageConfidence: number;
  };
  errors: Array<{ file: string; error: string }>;
}

export class DocumentIngestionPipeline {
  private static instance: DocumentIngestionPipeline;
  private ocrProcessor: OCRProcessor;
  private llmManager: LocalLLMManager;
  private auditAgent: AuditLLMAgent;

  static getInstance(): DocumentIngestionPipeline {
    if (!DocumentIngestionPipeline.instance) {
      DocumentIngestionPipeline.instance = new DocumentIngestionPipeline();
    }
    return DocumentIngestionPipeline.instance;
  }

  private constructor() {
    this.ocrProcessor = OCRProcessor.getInstance();
    this.llmManager = LocalLLMManager.getInstance();
    this.auditAgent = new AuditLLMAgent();
  }

  async initialize(): Promise<void> {
    console.log('🔄 Inicializando pipeline de ingestión...');

    await this.ocrProcessor.initialize();
    await this.llmManager.initialize();

    console.log('✅ Pipeline de ingestión inicializado');
  }

  async processDocuments(files: File[]): Promise<IngestionResult> {
    const startTime = Date.now();
    const results: ProcessedDocument[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    console.log(`📚 Iniciando procesamiento de ${files.length} documentos...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docStartTime = Date.now();

      try {
        console.log(`[${i + 1}/${files.length}] Procesando: ${file.name}`);

        // 1. Validar archivo
        const validation = await DocumentProcessor.validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 2. Preprocesar imagen si es necesario
        let processedFile = file;
        if (file.type.startsWith('image/')) {
          processedFile = await DocumentProcessor.preprocessImage(file);
        }

        // 3. OCR / Extracción de texto
        const metadata = await this.ocrProcessor.processDocument(processedFile);

        // 4. Procesamiento con LLM local
        const processedContent = await this.processWithLLM(metadata.extractedText || '');

        // 5. Análisis de cumplimiento básico
        const complianceAnalysis = await this.analyzeCompliance(metadata.extractedText || '');

        // 6. Crear documento procesado
        const processedDoc: ProcessedDocument = {
          id: `doc_${Date.now()}_${i}`,
          metadata,
          content: processedContent,
          compliance: complianceAnalysis,
          processing: {
            timestamp: Date.now(),
            processingTime: Date.now() - docStartTime,
            ocrConfidence: metadata.ocrConfidence || 0,
            llmConfidence: processedContent.confidence || 0
          }
        };

        results.push(processedDoc);
        console.log(`✅ ${file.name} procesado exitosamente`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error procesando ${file.name}:`, errorMsg);
        errors.push({ file: file.name, error: errorMsg });
      }
    }

    const totalTime = Date.now() - startTime;
    const successful = results.length;
    const failed = errors.length;
    const averageConfidence = results.length > 0
      ? results.reduce((sum, doc) => sum + ((doc.processing.ocrConfidence + doc.processing.llmConfidence) / 2), 0) / results.length
      : 0;

    const ingestionResult: IngestionResult = {
      documents: results,
      statistics: {
        totalProcessed: files.length,
        successful,
        failed,
        totalProcessingTime: totalTime,
        averageConfidence
      },
      errors
    };

    console.log(`🎉 Ingestión completada:`);
    console.log(`   ✅ Exitosos: ${successful}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`   ⏱️ Tiempo total: ${totalTime}ms`);
    console.log(`   📊 Confianza promedio: ${(averageConfidence * 100).toFixed(1)}%`);

    return ingestionResult;
  }

  private async processWithLLM(text: string): Promise<{
    rawText: string;
    processedText: string;
    entities: Record<string, string[]>;
    summary: string;
    keyPhrases: string[];
    confidence?: number;
  }> {
    try {
      // Extraer entidades
      const entities = await this.auditAgent.extractEntities(text);

      // Generar resumen
      const summaryPrompt = `
      Resume el siguiente texto de documento corporativo en 2-3 oraciones,
      enfocándote en aspectos de seguridad, cumplimiento y procesos:

      TEXTO:
      ${text.substring(0, 2000)} // Limitar longitud

      RESUMEN:
      `;

      const summaryResponse = await this.llmManager.generateResponse(summaryPrompt, {
        model: 'llama2:7b',
        temperature: 0.3,
        max_tokens: 200
      });

      // Extraer frases clave
      const keyPhrasesPrompt = `
      Extrae 5-8 frases clave o términos importantes del siguiente texto,
      enfocándote en conceptos de seguridad, cumplimiento normativo y procesos:

      TEXTO:
      ${text.substring(0, 1500)}

      FRASES CLAVE (separadas por comas):
      `;

      const keyPhrasesResponse = await this.llmManager.generateResponse(keyPhrasesPrompt, {
        model: 'llama2:7b',
        temperature: 0.1,
        max_tokens: 100
      });

      const keyPhrases = keyPhrasesResponse.text
        .split(',')
        .map(phrase => phrase.trim())
        .filter(phrase => phrase.length > 0)
        .slice(0, 8);

      return {
        rawText: text,
        processedText: this.cleanText(text),
        entities,
        summary: summaryResponse.text.trim(),
        keyPhrases,
        confidence: (summaryResponse.confidence + keyPhrasesResponse.confidence) / 2
      };

    } catch (error) {
      console.error('Error en procesamiento LLM:', error);
      // Fallback básico
      return {
        rawText: text,
        processedText: this.cleanText(text),
        entities: {},
        summary: 'Error generando resumen automático',
        keyPhrases: [],
        confidence: 0
      };
    }
  }

  private async analyzeCompliance(text: string): Promise<{
    relevantStandards: string[];
    extractedControls: string[];
    riskIndicators: string[];
  }> {
    try {
      const compliancePrompt = `
      Analiza el siguiente texto y identifica:
      1. Estándares normativos mencionados (ej: ISO 27001, GDPR, etc.)
      2. Controles de seguridad específicos mencionados
      3. Indicadores de riesgo o problemas identificados

      TEXTO:
      ${text.substring(0, 1500)}

      FORMATO DE RESPUESTA (JSON):
      {
        "standards": ["estándar1", "estándar2"],
        "controls": ["control1", "control2"],
        "risks": ["riesgo1", "riesgo2"]
      }
      `;

      const response = await this.llmManager.generateResponse(compliancePrompt, {
        model: 'llama2:7b',
        temperature: 0.1,
        max_tokens: 300
      });

      const analysis = JSON.parse(response.text);

      return {
        relevantStandards: analysis.standards || [],
        extractedControls: analysis.controls || [],
        riskIndicators: analysis.risks || []
      };

    } catch (error) {
      console.error('Error en análisis de cumplimiento:', error);
      return {
        relevantStandards: [],
        extractedControls: [],
        riskIndicators: []
      };
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Múltiples espacios por uno
      .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ.,;:()[\]{}¿?¡!@#$%^&*+-=]/g, '') // Caracteres especiales
      .trim();
  }

  getStatus(): {
    ocr: any;
    llm: any;
    pipeline: boolean;
  } {
    return {
      ocr: this.ocrProcessor.getStatus(),
      llm: this.llmManager.getStatus(),
      pipeline: true
    };
  }

  async cleanup(): Promise<void> {
    await this.ocrProcessor.cleanup();
    await this.llmManager.cleanup();
    console.log('🧹 Pipeline de ingestión limpiado');
  }
}

// Utility class for document management
export class DocumentManager {
  private static instance: DocumentManager;
  private documents: Map<string, ProcessedDocument> = new Map();
  private bm25Engine: BM25SearchEngine;
  private faissEngine: FAISSSearchEngine;
  private searchBenchmark: SearchEngineBenchmark;
  private searchEnginesInitialized: boolean = false;

  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  constructor() {
    this.bm25Engine = new BM25SearchEngine();
    this.faissEngine = new FAISSSearchEngine();
    this.searchBenchmark = new SearchEngineBenchmark();
  }

  async initializeSearchEngines(): Promise<void> {
    if (this.searchEnginesInitialized) return;

    const docs = this.getAllDocuments();
    if (docs.length === 0) return;

    // Preparar documentos para indexación
    const searchDocuments = docs.map(doc => ({
      id: doc.id,
      content: `${doc.content.processedText} ${doc.content.keyPhrases.join(' ')} ${doc.metadata.filename}`,
      metadata: {
        filename: doc.metadata.filename,
        type: doc.metadata.type,
        standards: doc.compliance.relevantStandards
      }
    }));

    await this.searchBenchmark.initialize(searchDocuments);
    this.searchEnginesInitialized = true;
    console.log('Motores de búsqueda avanzados inicializados');
  }

  addDocument(doc: ProcessedDocument): void {
    this.documents.set(doc.id, doc);
    // Reinicializar motores de búsqueda cuando se agregan documentos
    this.searchEnginesInitialized = false;
  }

  getDocument(id: string): ProcessedDocument | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): ProcessedDocument[] {
    return Array.from(this.documents.values());
  }

  async searchDocuments(query: string, engine: 'bm25' | 'faiss' | 'basic' = 'bm25'): Promise<ProcessedDocument[]> {
    // Si no hay documentos, devolver array vacío
    if (this.documents.size === 0) return [];

    // Búsqueda básica (fallback)
    if (engine === 'basic') {
      const lowercaseQuery = query.toLowerCase();
      return this.getAllDocuments().filter(doc =>
        doc.content.processedText.toLowerCase().includes(lowercaseQuery) ||
        doc.metadata.filename.toLowerCase().includes(lowercaseQuery) ||
        doc.content.keyPhrases.some(phrase => phrase.toLowerCase().includes(lowercaseQuery))
      );
    }

    // Inicializar motores si no están listos
    if (!this.searchEnginesInitialized) {
      await this.initializeSearchEngines();
    }

    // Usar motores avanzados
    const engines = this.searchBenchmark.getEngines();
    const searchEngine = engine === 'bm25' ? engines.bm25 : engines.faiss;

    try {
      const results = await searchEngine.search(query, 20); // Top 20 resultados

      // Convertir resultados de búsqueda a documentos procesados
      return results
        .map(result => this.getDocument(result.documentId))
        .filter((doc): doc is ProcessedDocument => doc !== undefined);

    } catch (error) {
      console.warn(`Error en búsqueda ${engine}, usando búsqueda básica:`, error);
      // Fallback a búsqueda básica
      return this.searchDocuments(query, 'basic');
    }
  }

  getDocumentsByStandard(standard: string): ProcessedDocument[] {
    return this.getAllDocuments().filter(doc =>
      doc.compliance.relevantStandards.some(s =>
        s.toLowerCase().includes(standard.toLowerCase())
      )
    );
  }

  async benchmarkSearch(query: string): Promise<any> {
    if (!this.searchEnginesInitialized) {
      await this.initializeSearchEngines();
    }

    return await this.searchBenchmark.benchmarkQuery(query);
  }

  getSearchEngineStats(): any {
    if (!this.searchEnginesInitialized) {
      return { status: 'not_initialized' };
    }

    const engines = this.searchBenchmark.getEngines();
    return {
      bm25: engines.bm25.getStats(),
      faiss: engines.faiss.getStats(),
      initialized: true
    };
  }

  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    averageConfidence: number;
    totalSize: number;
  } {
    const docs = this.getAllDocuments();
    const byType: Record<string, number> = {};
    let totalConfidence = 0;
    let totalSize = 0;

    docs.forEach(doc => {
      const type = doc.metadata.type;
      byType[type] = (byType[type] || 0) + 1;
      totalConfidence += (doc.processing.ocrConfidence + doc.processing.llmConfidence) / 2;
      totalSize += doc.metadata.size;
    });

    return {
      total: docs.length,
      byType,
      averageConfidence: docs.length > 0 ? totalConfidence / docs.length : 0,
      totalSize
    };
  }
}