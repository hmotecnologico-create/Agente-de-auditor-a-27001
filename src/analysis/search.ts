import { pipeline } from '@xenova/transformers';

export interface SearchResult {
  documentId: string;
  score: number;
  content: string;
  metadata: any;
}

export interface SearchEngine {
  index(documents: Array<{ id: string; content: string; metadata?: any }>): Promise<void>;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  getStats(): any;
}

export class BM25SearchEngine implements SearchEngine {
  private documents: Array<{ id: string; content: string; metadata?: any }> = [];
  private termFreq: Map<string, Map<string, number>> = new Map(); // term -> docId -> frequency
  private docLengths: Map<string, number> = new Map(); // docId -> length
  private avgDocLength: number = 0;
  private totalDocs: number = 0;
  private k1: number = 1.5; // BM25 parameter
  private b: number = 0.75; // BM25 parameter

  async index(documents: Array<{ id: string; content: string; metadata?: any }>): Promise<void> {
    this.documents = documents;
    this.termFreq.clear();
    this.docLengths.clear();
    this.totalDocs = documents.length;

    // Preprocesar documentos
    for (const doc of documents) {
      const terms = this.preprocessText(doc.content);
      this.docLengths.set(doc.id, terms.length);

      // Contar frecuencia de términos
      const termCount = new Map<string, number>();
      for (const term of terms) {
        termCount.set(term, (termCount.get(term) || 0) + 1);
      }

      // Almacenar frecuencia por documento
      for (const [term, freq] of termCount) {
        if (!this.termFreq.has(term)) {
          this.termFreq.set(term, new Map());
        }
        this.termFreq.get(term)!.set(doc.id, freq);
      }
    }

    // Calcular longitud promedio de documentos
    const totalLength = Array.from(this.docLengths.values()).reduce((sum, len) => sum + len, 0);
    this.avgDocLength = totalLength / this.totalDocs;
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const queryTerms = this.preprocessText(query);
    const scores = new Map<string, number>();

    // Calcular score BM25 para cada documento
    for (const doc of this.documents) {
      let score = 0;
      const docLength = this.docLengths.get(doc.id) || 0;

      for (const term of queryTerms) {
        const termFreqInDoc = this.termFreq.get(term)?.get(doc.id) || 0;
        const df = this.termFreq.get(term)?.size || 0; // document frequency

        if (termFreqInDoc > 0 && df > 0) {
          // IDF (Inverse Document Frequency)
          const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5));

          // BM25 score
          const numerator = termFreqInDoc * (this.k1 + 1);
          const denominator = termFreqInDoc + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

          score += idf * (numerator / denominator);
        }
      }

      if (score > 0) {
        scores.set(doc.id, score);
      }
    }

    // Ordenar por score y tomar top resultados
    const results: SearchResult[] = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => {
        const doc = this.documents.find(d => d.id === docId)!;
        return {
          documentId: docId,
          score,
          content: doc.content,
          metadata: doc.metadata
        };
      });

    return results;
  }

  getStats() {
    return {
      engine: 'BM25',
      totalDocuments: this.documents.length,
      totalTerms: this.termFreq.size,
      avgDocLength: Math.round(this.avgDocLength),
      parameters: { k1: this.k1, b: this.b }
    };
  }

  private preprocessText(text: string): string[] {
    // Tokenización simple: dividir por espacios y filtrar palabras vacías
    const stopwords = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'a', 'en', 'un', 'una', 'con', 'por', 'para', 'es', 'son', 'que', 'como']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));
  }
}

export class FAISSSearchEngine implements SearchEngine {
  private embeddings: number[][] = [];
  private documents: Array<{ id: string; content: string; metadata?: any }> = [];
  private extractor: any = null;

  async index(documents: Array<{ id: string; content: string; metadata?: any }>): Promise<void> {
    this.documents = documents;

    // Inicializar el extractor de embeddings
    this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Generar embeddings para todos los documentos
    console.log('Generando embeddings para FAISS...');
    this.embeddings = [];

    for (const doc of documents) {
      const embedding = await this.generateEmbedding(doc.content);
      this.embeddings.push(embedding);
    }

    console.log(`Embeddings generados: ${this.embeddings.length} documentos`);
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.extractor || this.embeddings.length === 0) {
      throw new Error('FAISS index not initialized');
    }

    // Generar embedding para la query
    const queryEmbedding = await this.generateEmbedding(query);

    // Calcular similitud coseno con todos los documentos
    const similarities: Array<{ index: number; score: number }> = [];

    for (let i = 0; i < this.embeddings.length; i++) {
      const similarity = this.cosineSimilarity(queryEmbedding, this.embeddings[i]);
      similarities.push({ index: i, score: similarity });
    }

    // Ordenar por similitud y tomar los top resultados
    const results: SearchResult[] = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ index, score }) => ({
        documentId: this.documents[index].id,
        score,
        content: this.documents[index].content,
        metadata: this.documents[index].metadata
      }));

    return results;
  }

  getStats() {
    return {
      engine: 'FAISS',
      totalDocuments: this.documents.length,
      embeddingDimension: this.embeddings[0]?.length || 0,
      model: 'Xenova/all-MiniLM-L6-v2'
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Truncar texto largo para evitar problemas de memoria
    const truncatedText = text.length > 512 ? text.substring(0, 512) : text;

    const output = await this.extractor(truncatedText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export class SearchEngineBenchmark {
  private bm25Engine: BM25SearchEngine;
  private faissEngine: FAISSSearchEngine;

  constructor() {
    this.bm25Engine = new BM25SearchEngine();
    this.faissEngine = new FAISSSearchEngine();
  }

  async initialize(documents: Array<{ id: string; content: string; metadata?: any }>): Promise<void> {
    console.log('Inicializando motores de búsqueda...');

    // Indexar BM25
    const bm25Start = Date.now();
    await this.bm25Engine.index(documents);
    const bm25Time = Date.now() - bm25Start;
    console.log(`BM25 indexado en ${bm25Time}ms`);

    // Indexar FAISS
    const faissStart = Date.now();
    await this.faissEngine.index(documents);
    const faissTime = Date.now() - faissStart;
    console.log(`FAISS indexado en ${faissTime}ms`);
  }

  async benchmarkQuery(query: string, iterations: number = 5): Promise<any> {
    const results = {
      query,
      bm25: { times: [], results: null as any },
      faiss: { times: [], results: null as any }
    };

    // Benchmark BM25
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const bm25Results = await this.bm25Engine.search(query, 10);
      const time = Date.now() - start;
      results.bm25.times.push(time);
      if (i === 0) results.bm25.results = bm25Results;
    }

    // Benchmark FAISS
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const faissResults = await this.faissEngine.search(query, 10);
      const time = Date.now() - start;
      results.faiss.times.push(time);
      if (i === 0) results.faiss.results = faissResults;
    }

    // Calcular estadísticas
    const bm25Avg = results.bm25.times.reduce((a, b) => a + b, 0) / results.bm25.times.length;
    const faissAvg = results.faiss.times.reduce((a, b) => a + b, 0) / results.faiss.times.length;

    return {
      ...results,
      stats: {
        bm25: {
          avgTime: bm25Avg,
          minTime: Math.min(...results.bm25.times),
          maxTime: Math.max(...results.bm25.times),
          resultCount: results.bm25.results.length
        },
        faiss: {
          avgTime: faissAvg,
          minTime: Math.min(...results.faiss.times),
          maxTime: Math.max(...results.faiss.times),
          resultCount: results.faiss.results.length
        },
        comparison: {
          faster: bm25Avg < faissAvg ? 'BM25' : 'FAISS',
          timeDifference: Math.abs(bm25Avg - faissAvg)
        }
      }
    };
  }

  getEngines() {
    return {
      bm25: this.bm25Engine,
      faiss: this.faissEngine
    };
  }
}