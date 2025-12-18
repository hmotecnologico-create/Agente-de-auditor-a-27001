// Performance Analysis & Benchmarking Module
export interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expectedComplexity: 'Low' | 'Medium' | 'High';
  category: 'Compliance' | 'Security' | 'Analysis' | 'General';
}

export interface PerformanceResult {
  testId: string;
  provider: string;
  responseTime: number;
  tokensUsed: number;
  cost: number;
  accuracy: number;
  throughput: number; // requests per second
  latency: number; // average response time
  errorRate: number;
  timestamp: number;
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  tests: PerformanceTest[];
  results: PerformanceResult[];
  summary: {
    bestProvider: string;
    averageResponseTime: number;
    totalCost: number;
    overallAccuracy: number;
    recommendations: string[];
  };
  executedAt: number;
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer;
  private testSuites: BenchmarkSuite[] = [];
  private currentSuite: BenchmarkSuite | null = null;

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }

  // Predefined test cases for compliance auditing
  private getComplianceTests(): PerformanceTest[] {
    return [
      {
        id: 'compliance-001',
        name: 'ISO 27001 Password Policy Analysis',
        description: 'Analyze password policy compliance with ISO 27001 requirements',
        prompt: `Analiza la siguiente política de contraseñas y determina si cumple con ISO 27001 A.9.4.3:

Política actual:
- Longitud mínima: 8 caracteres
- Requiere mayúsculas, minúsculas, números y símbolos
- Cambio cada 90 días
- No reutilización de últimas 5 contraseñas

Proporciona una evaluación detallada con evidencia específica.`,
        expectedComplexity: 'Medium',
        category: 'Compliance'
      },
      {
        id: 'compliance-002',
        name: 'GDPR Data Retention Assessment',
        description: 'Evaluate GDPR compliance for data retention policies',
        prompt: `Evalúa el siguiente procedimiento de retención de datos según GDPR Artículo 5.1(e):

Procedimiento:
Los datos personales se conservarán durante el tiempo necesario para los fines del tratamiento, con un máximo de 3 años para análisis de marketing post-terminación de la relación contractual.

¿Cumple este procedimiento con el principio de limitación del plazo de conservación? Justifica tu respuesta con referencias específicas al RGPD.`,
        expectedComplexity: 'High',
        category: 'Compliance'
      },
      {
        id: 'security-001',
        name: 'Access Control Analysis',
        description: 'Analyze access control mechanisms for security compliance',
        prompt: `Analiza el siguiente control de acceso y evalúa su efectividad:

Sistema implementado:
- Autenticación multifactor (MFA) para accesos remotos
- Control de acceso basado en roles (RBAC)
- Logs de auditoría de todos los accesos
- Revisión trimestral de permisos

Identifica fortalezas y debilidades desde una perspectiva de seguridad de la información.`,
        expectedComplexity: 'Medium',
        category: 'Security'
      },
      {
        id: 'analysis-001',
        name: 'Risk Assessment Complex',
        description: 'Complex risk assessment requiring multi-document analysis',
        prompt: `Realiza una evaluación de riesgos comprehensiva basada en los siguientes elementos:

1. Activos críticos identificados: Base de datos de clientes, Sistema de pagos, Servidores de aplicación
2. Amenazas: Ransomware, DDoS, Acceso no autorizado, Pérdida de datos
3. Controles existentes: Antivirus, Firewall, Backups diarios, MFA
4. Incidentes previos: 2 intentos de phishing exitosos, 1 breach menor

Para cada activo, calcula el riesgo residual (Riesgo = Probabilidad × Impacto) y proporciona recomendaciones de mitigación priorizadas.`,
        expectedComplexity: 'High',
        category: 'Analysis'
      },
      {
        id: 'general-001',
        name: 'Simple Compliance Check',
        description: 'Basic compliance verification task',
        prompt: `Verifica si la siguiente afirmación cumple con ISO 27001: "Todos los empleados deben usar contraseñas de al menos 8 caracteres". Responde solo con "CUMPLE" o "NO CUMPLE" y una breve justificación.`,
        expectedComplexity: 'Low',
        category: 'General'
      }
    ];
  }

  async createBenchmarkSuite(name: string, description: string): Promise<string> {
    const suiteId = `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const suite: BenchmarkSuite = {
      id: suiteId,
      name,
      description,
      tests: this.getComplianceTests(),
      results: [],
      summary: {
        bestProvider: '',
        averageResponseTime: 0,
        totalCost: 0,
        overallAccuracy: 0,
        recommendations: []
      },
      executedAt: 0
    };

    this.testSuites.push(suite);
    this.currentSuite = suite;

    return suiteId;
  }

  async runBenchmarkSuite(suiteId: string, providers: string[] = ['gemini', 'openai', 'claude']): Promise<BenchmarkSuite> {
    const suite = this.testSuites.find(s => s.id === suiteId);
    if (!suite) {
      throw new Error(`Benchmark suite ${suiteId} not found`);
    }

    console.log(`🚀 Iniciando benchmark suite: ${suite.name}`);
    console.log(`📊 Tests a ejecutar: ${suite.tests.length}`);
    console.log(`🤖 Proveedores a comparar: ${providers.join(', ')}`);

    const results: PerformanceResult[] = [];

    // Run tests for each provider
    for (const provider of providers) {
      console.log(`\n🔄 Ejecutando tests con ${provider.toUpperCase()}...`);

      for (const test of suite.tests) {
        try {
          const result = await this.runSingleTest(test, provider);
          results.push(result);
          console.log(`  ✅ ${test.name}: ${result.responseTime.toFixed(2)}ms`);
        } catch (error) {
          console.error(`  ❌ Error en ${test.name} con ${provider}:`, error);
          // Add error result
          results.push({
            testId: test.id,
            provider,
            responseTime: 0,
            tokensUsed: 0,
            cost: 0,
            accuracy: 0,
            throughput: 0,
            latency: 0,
            errorRate: 1,
            timestamp: Date.now()
          });
        }
      }
    }

    // Calculate summary
    const summary = this.calculateSuiteSummary(results, providers);
    suite.results = results;
    suite.summary = summary;
    suite.executedAt = Date.now();

    console.log(`\n🏆 Benchmark completado:`);
    console.log(`  🥇 Mejor proveedor: ${summary.bestProvider}`);
    console.log(`  ⏱️  Tiempo promedio: ${summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`  💰 Costo total: $${summary.totalCost.toFixed(4)}`);
    console.log(`  🎯 Precisión general: ${(summary.overallAccuracy * 100).toFixed(1)}%`);

    return suite;
  }

  private async runSingleTest(test: PerformanceTest, provider: string): Promise<PerformanceResult> {
    const startTime = performance.now();

    try {
      // Simulate API call with different response times per provider
      const providerDelays = {
        gemini: 800 + Math.random() * 400,  // 800-1200ms
        openai: 600 + Math.random() * 300,  // 600-900ms
        claude: 1000 + Math.random() * 500  // 1000-1500ms
      };

      const delay = providerDelays[provider as keyof typeof providerDelays] || 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      const responseTime = performance.now() - startTime;

      // Simulate response quality based on provider and test complexity
      const baseAccuracy = {
        gemini: 0.85,
        openai: 0.90,
        claude: 0.88
      };

      const complexityMultiplier = {
        Low: 1.0,
        Medium: 0.95,
        High: 0.90
      };

      const accuracy = baseAccuracy[provider as keyof typeof baseAccuracy] *
                      complexityMultiplier[test.expectedComplexity] +
                      (Math.random() - 0.5) * 0.1; // Add some variance

      // Calculate tokens and cost
      const tokensUsed = Math.round(test.prompt.length / 4) + Math.round(Math.random() * 500);
      const costPerToken = {
        gemini: 0.000001,
        openai: 0.000002,
        claude: 0.000008
      };

      const cost = tokensUsed * costPerToken[provider as keyof typeof costPerToken];

      return {
        testId: test.id,
        provider,
        responseTime,
        tokensUsed,
        cost,
        accuracy: Math.max(0, Math.min(1, accuracy)),
        throughput: 1000 / responseTime, // requests per second
        latency: responseTime,
        errorRate: 0,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        testId: test.id,
        provider,
        responseTime: performance.now() - startTime,
        tokensUsed: 0,
        cost: 0,
        accuracy: 0,
        throughput: 0,
        latency: performance.now() - startTime,
        errorRate: 1,
        timestamp: Date.now()
      };
    }
  }

  private calculateSuiteSummary(results: PerformanceResult[], providers: string[]): BenchmarkSuite['summary'] {
    if (results.length === 0) {
      return {
        bestProvider: '',
        averageResponseTime: 0,
        totalCost: 0,
        overallAccuracy: 0,
        recommendations: ['No se pudieron obtener resultados']
      };
    }

    // Calculate averages per provider
    const providerStats = providers.map(provider => {
      const providerResults = results.filter(r => r.provider === provider && r.errorRate === 0);

      if (providerResults.length === 0) {
        return {
          provider,
          avgResponseTime: Infinity,
          avgAccuracy: 0,
          totalCost: 0,
          score: 0
        };
      }

      const avgResponseTime = providerResults.reduce((sum, r) => sum + r.responseTime, 0) / providerResults.length;
      const avgAccuracy = providerResults.reduce((sum, r) => sum + r.accuracy, 0) / providerResults.length;
      const totalCost = providerResults.reduce((sum, r) => sum + r.cost, 0);

      // Calculate composite score (30% speed, 40% accuracy, 30% cost efficiency)
      const normalizedSpeed = Math.max(0, 1 - avgResponseTime / 2000); // Normalize to 2s max
      const normalizedCost = Math.max(0, 1 - totalCost / 0.1); // Normalize to $0.10 max
      const score = (normalizedSpeed * 0.3) + (avgAccuracy * 0.4) + (normalizedCost * 0.3);

      return {
        provider,
        avgResponseTime,
        avgAccuracy,
        totalCost,
        score
      };
    });

    // Find best provider
    const bestProvider = providerStats.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Overall statistics
    const validResults = results.filter(r => r.errorRate === 0);
    const averageResponseTime = validResults.length > 0 ?
      validResults.reduce((sum, r) => sum + r.responseTime, 0) / validResults.length : 0;

    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const overallAccuracy = validResults.length > 0 ?
      validResults.reduce((sum, r) => sum + r.accuracy, 0) / validResults.length : 0;

    // Generate recommendations
    const recommendations: string[] = [];

    recommendations.push(`🥇 Proveedor recomendado: ${bestProvider.provider.toUpperCase()}`);
    recommendations.push(`⚡ Mejor tiempo de respuesta: ${bestProvider.avgResponseTime.toFixed(2)}ms`);
    recommendations.push(`🎯 Mejor precisión: ${(bestProvider.avgAccuracy * 100).toFixed(1)}%`);

    if (bestProvider.totalCost < 0.01) {
      recommendations.push(`💰 Opción más económica: ${bestProvider.provider.toUpperCase()}`);
    }

    // Performance insights
    const fastestProvider = providerStats.reduce((fastest, current) =>
      current.avgResponseTime < fastest.avgResponseTime ? current : fastest
    );

    if (fastestProvider.provider !== bestProvider.provider) {
      recommendations.push(`💨 Más rápido: ${fastestProvider.provider.toUpperCase()} (${fastestProvider.avgResponseTime.toFixed(2)}ms)`);
    }

    return {
      bestProvider: bestProvider.provider,
      averageResponseTime,
      totalCost,
      overallAccuracy,
      recommendations
    };
  }

  // Get performance report for a specific suite
  getSuiteReport(suiteId: string): BenchmarkSuite | null {
    return this.testSuites.find(s => s.id === suiteId) || null;
  }

  // Get all available suites
  getAllSuites(): BenchmarkSuite[] {
    return this.testSuites;
  }

  // Export results to JSON
  exportResults(suiteId: string): string {
    const suite = this.getSuiteReport(suiteId);
    if (!suite) return '{}';

    return JSON.stringify(suite, null, 2);
  }

  // Get real-time performance metrics
  getRealTimeMetrics(): {
    activeSuites: number;
    totalTestsExecuted: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const activeSuites = this.testSuites.length;
    const allResults = this.testSuites.flatMap(s => s.results);
    const totalTestsExecuted = allResults.length;
    const validResults = allResults.filter(r => r.errorRate === 0);

    const averageResponseTime = validResults.length > 0 ?
      validResults.reduce((sum, r) => sum + r.responseTime, 0) / validResults.length : 0;

    const errorRate = totalTestsExecuted > 0 ?
      (allResults.filter(r => r.errorRate > 0).length / totalTestsExecuted) : 0;

    return {
      activeSuites,
      totalTestsExecuted,
      averageResponseTime,
      errorRate
    };
  }
}