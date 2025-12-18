// Local LLM Module - Mock Implementation for TFM (Browser Compatible)
// Simula respuestas de LLM local para demostración del TFM

export interface LocalLLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  context_window?: number;
}

export interface LLMResponse {
  text: string;
  tokens_used: number;
  processing_time: number;
  model: string;
  confidence?: number;
}

export interface LocalModelInfo {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
  available: boolean;
}

export class LocalLLMManager {
  private static instance: LocalLLMManager;
  private isInitialized: boolean = false;
  private availableModels: LocalModelInfo[] = [];
  private defaultConfig: LocalLLMConfig = {
    model: 'llama2:7b',
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    context_window: 4096
  };

  private constructor() {
    // Mock implementation - no external dependencies
  }

  static getInstance(): LocalLLMManager {
    if (!LocalLLMManager.instance) {
      LocalLLMManager.instance = new LocalLLMManager();
    }
    return LocalLLMManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Inicializando LLM local (simulación para TFM)...');

      // Simular inicialización
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Modelos simulados disponibles
      this.availableModels = [
        {
          name: 'llama2:7b',
          size: 3820000000,
          modified_at: new Date().toISOString(),
          digest: 'mock-digest-llama2',
          available: true
        },
        {
          name: 'mistral:7b',
          size: 4100000000,
          modified_at: new Date().toISOString(),
          digest: 'mock-digest-mistral',
          available: true
        }
      ];

      this.isInitialized = true;
      console.log('✅ LLM local inicializado correctamente (modo simulación)');

    } catch (error) {
      console.error('❌ Error inicializando LLM local:', error);
      throw new Error('Error en simulación de LLM local.');
    }
  }

  async generateResponse(
    prompt: string,
    config?: Partial<LocalLLMConfig>
  ): Promise<LLMResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();

    try {
      console.log(`🤖 Generando respuesta con modelo local: ${finalConfig.model}`);

      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Generar respuesta simulada basada en el tipo de prompt
      const response = this.generateMockResponse(prompt, finalConfig);

      const processingTime = Date.now() - startTime;

      return {
        text: response,
        tokens_used: Math.floor(prompt.length / 4) + Math.floor(response.length / 4),
        processing_time: processingTime,
        model: finalConfig.model,
        confidence: 0.85 + Math.random() * 0.1 // 85-95% confidence
      };

    } catch (error) {
      console.error('❌ Error generando respuesta:', error);
      throw error;
    }
  }

  async chatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    config?: Partial<LocalLLMConfig>
  ): Promise<LLMResponse> {
    // Convertir conversación a prompt simple para simulación
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    return this.generateResponse(prompt, config);
  }

  private generateMockResponse(prompt: string, config: LocalLLMConfig): string {
    const lowerPrompt = prompt.toLowerCase();

    // Respuestas simuladas basadas en el contenido del prompt
    if (lowerPrompt.includes('cumplimiento') || lowerPrompt.includes('compliance')) {
      return `Basado en el análisis de los documentos proporcionados, el cumplimiento con ISO 27001 es satisfactorio. Se identificaron 3 controles principales que requieren atención:

1. **A.9.2.1 - Asignación de privilegios**: Los documentos muestran una adecuada segregación de funciones, pero se recomienda reforzar los procedimientos de revisión periódica.

2. **A.12.6.1 - Registro de eventos**: El sistema de logging está implementado correctamente con retención de 7 años.

3. **A.18.1.3 - Protección contra malware**: Se detectaron medidas preventivas adecuadas, incluyendo actualizaciones automáticas y escaneos regulares.

Recomendación: Implementar revisiones trimestrales de acceso y actualizar la política de contraseñas según las mejores prácticas actuales.`;
    }

    if (lowerPrompt.includes('entidad') || lowerPrompt.includes('entity') || lowerPrompt.includes('extraer')) {
      return `{
  "personas": ["Juan Pérez", "María García", "Carlos Rodríguez"],
  "fechas": ["2023-01-15", "2024-06-30", "2023-12-31"],
  "políticas": ["Política de Seguridad de la Información", "Política de Acceso", "Política de Contraseñas"],
  "controles": ["A.9.2.1", "A.12.6.1", "A.18.1.3"],
  "departamentos": ["TI", "Recursos Humanos", "Seguridad"],
  "documentos": ["Política_Seguridad_2023.pdf", "Procedimiento_Acceso.pdf"]
}`;
    }

    if (lowerPrompt.includes('riesgo') || lowerPrompt.includes('risk')) {
      return `Análisis de riesgos identificado:

**Riesgos Críticos:**
1. **Acceso no autorizado a sistemas críticos** - Probabilidad: Media, Impacto: Alto
2. **Pérdida de datos sensibles** - Probabilidad: Baja, Impacto: Muy Alto
3. **Malware y ataques cibernéticos** - Probabilidad: Alta, Impacto: Alto

**Medidas Recomendadas:**
- Implementar autenticación multifactor
- Realizar copias de seguridad cifradas diariamente
- Actualizar software de seguridad semanalmente
- Realizar simulacros de incidentes trimestralmente

**Puntuación de Riesgo General:** 6.2/10 (Moderado)`;
    }

    // Respuesta genérica por defecto
    return `Como modelo de lenguaje local especializado en auditoría de seguridad de la información, he analizado la consulta proporcionada.

El análisis revela que los controles implementados están alineados con los requisitos de ISO 27001, con algunas áreas de mejora identificadas. Se recomienda:

1. Fortalecer los procedimientos de monitoreo continuo
2. Actualizar la documentación de procesos críticos
3. Implementar métricas de cumplimiento automatizadas
4. Realizar revisiones periódicas de efectividad

Esta evaluación se basa en las mejores prácticas de seguridad de la información y estándares internacionales reconocidos.`;
  }

  async pullModel(modelName: string): Promise<void> {
    console.log(`⬇️ Simulando descarga del modelo: ${modelName}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ Modelo ${modelName} "descargado" correctamente (simulación)`);
  }

  async deleteModel(modelName: string): Promise<void> {
    console.log(`🗑️ Simulando eliminación del modelo: ${modelName}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`✅ Modelo ${modelName} "eliminado" (simulación)`);
  }

  getAvailableModels(): LocalModelInfo[] {
    return this.availableModels;
  }

  isModelAvailable(modelName: string): boolean {
    return this.availableModels.some(model => model.name === modelName);
  }

  getStatus(): {
    initialized: boolean;
    models_count: number;
    available_models: string[]
  } {
    return {
      initialized: this.isInitialized,
      models_count: this.availableModels.length,
      available_models: this.availableModels.map(m => m.name)
    };
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    console.log('🧹 LLM local limpiado');
  }
}

// Specialized classes for audit-specific tasks
export class AuditLLMAgent {
  private llm: LocalLLMManager;

  constructor() {
    this.llm = LocalLLMManager.getInstance();
  }

  async analyzeCompliance(
    requirement: string,
    documents: string[],
    standard: string = 'ISO 27001'
  ): Promise<{
    status: 'Cumple' | 'No Cumple' | 'Parcial' | 'No Aplica';
    justification: string;
    evidence: string;
    confidence: number;
  }> {
    const prompt = `
    ACTÚA COMO: Auditor experto en ciberseguridad y cumplimiento normativo (${standard}).
    TAREA: Evaluar el cumplimiento del siguiente requisito basándote ÚNICAMENTE en la evidencia documental proporcionada.

    REQUISITO A VERIFICAR:
    ${requirement}

    DOCUMENTOS ANALIZADOS:
    ${documents.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}

    INSTRUCCIONES:
    1. Busca evidencia concreta que confirme o contradiga el requisito.
    2. Sé estricto pero justo en tu evaluación.
    3. Si no hay información suficiente, marca como "No Aplica".
    4. Proporciona citas específicas de los documentos.

    FORMATO DE RESPUESTA (JSON):
    {
      "status": "Cumple" | "No Cumple" | "Parcial" | "No Aplica",
      "justification": "Explicación técnica detallada",
      "evidence": "Citas textuales de los documentos",
      "confidence": 0.0-1.0
    }
    `;

    try {
      const response = await this.llm.generateResponse(prompt, {
        model: 'llama2:7b',
        temperature: 0.1 // Baja temperatura para consistencia
      });

      // Parsear respuesta JSON simulada
      const result = this.parseComplianceResponse(response.text);

      return {
        status: result.status,
        justification: result.justification,
        evidence: result.evidence,
        confidence: result.confidence || response.confidence || 0.5
      };

    } catch (error) {
      console.error('Error en análisis de cumplimiento:', error);
      return {
        status: 'No Aplica',
        justification: 'Error técnico en el análisis LLM local',
        evidence: 'N/A',
        confidence: 0.0
      };
    }
  }

  async extractEntities(
    text: string,
    entityTypes: string[] = ['personas', 'fechas', 'políticas', 'controles']
  ): Promise<Record<string, string[]>> {
    const prompt = `
    Extrae las siguientes entidades del texto proporcionado:

    TEXTO:
    ${text}

    TIPOS DE ENTIDADES A EXTRAER:
    ${entityTypes.join(', ')}

    INSTRUCCIONES:
    - Sé preciso y específico
    - Agrupa por tipo de entidad
    - Incluye contexto cuando sea relevante
    - Si no encuentras una entidad, déjala vacía

    FORMATO DE RESPUESTA (JSON):
    {
      "personas": ["entidad1", "entidad2"],
      "fechas": ["fecha1", "fecha2"],
      "políticas": ["política1", "política2"],
      "controles": ["control1", "control2"]
    }
    `;

    try {
      const response = await this.llm.generateResponse(prompt, {
        model: 'llama2:7b',
        temperature: 0.0 // Determinístico para extracción
      });

      return this.parseEntityResponse(response.text);

    } catch (error) {
      console.error('Error extrayendo entidades:', error);
      return {};
    }
  }

  private parseComplianceResponse(text: string): any {
    try {
      // Intentar parsear como JSON
      return JSON.parse(text);
    } catch {
      // Si no es JSON válido, crear estructura por defecto basada en el texto
      return {
        status: text.includes('Cumple') ? 'Cumple' : text.includes('No Cumple') ? 'No Cumple' : 'Parcial',
        justification: text,
        evidence: 'Análisis basado en documentos proporcionados',
        confidence: 0.75
      };
    }
  }

  private parseEntityResponse(text: string): Record<string, string[]> {
    try {
      return JSON.parse(text);
    } catch {
      // Fallback: extraer entidades manualmente del texto
      return {
        personas: this.extractFromText(text, /(?:Sr\.|Sra\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g),
        fechas: this.extractFromText(text, /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{2,4}[-\/]\d{1,2}[-\/]\d{1,2}/g),
        politicas: this.extractFromText(text, /política|política|Política/gi),
        controles: this.extractFromText(text, /[A-Z]\.\d+(?:\.\d+)*/g)
      };
    }
  }

  private extractFromText(text: string, regex: RegExp): string[] {
    const matches = text.match(regex) || [];
    return [...new Set(matches)]; // Remover duplicados
  }
}