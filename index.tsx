import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, SchemaType, Type } from "@google/genai";
import { 
  Shield, 
  FileText, 
  Search, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play, 
  RefreshCw,
  Cpu,
  Database,
  Lock,
  ChevronRight,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// --- Configuration & Data Models ---

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  processed: boolean;
}

interface Regulation {
  id: string;
  standard: 'ISO 27001' | 'GDPR' | 'Internal Policy';
  control: string;
  requirement: string;
}

interface AuditResult {
  regulationId: string;
  status: 'Cumple' | 'No Cumple' | 'Parcial' | 'No Aplica';
  justification: string;
  evidence: string;
  timestamp: number;
}

// --- MOCK DATA GENERATORS (Module 1 Simulation) ---

const MOCK_REGULATIONS: Regulation[] = [
  {
    id: 'ISO-01',
    standard: 'ISO 27001',
    control: 'A.9.4.3',
    requirement: 'El sistema de gestión de contraseñas debe imponer una longitud mínima de 8 caracteres y complejidad (alfanuméricos).'
  },
  {
    id: 'ISO-02',
    standard: 'ISO 27001',
    control: 'A.12.6.1',
    requirement: 'Se debe mantener un registro de auditoría de los accesos a sistemas críticos.'
  },
  {
    id: 'GDPR-01',
    standard: 'GDPR',
    control: 'Art. 5.1(e)',
    requirement: 'Los datos personales no deben conservarse más tiempo del necesario para los fines del tratamiento (Limitación del plazo de conservación).'
  },
  {
    id: 'INT-01',
    standard: 'Internal Policy',
    control: 'POL-SEC-04',
    requirement: 'Todos los empleados deben bloquear sus estaciones de trabajo tras 5 minutos de inactividad.'
  }
];

// This function simulates reading PDFs that have intentional errors as per the Prompt
const generateSyntheticCorpus = (): Document[] => [
  {
    id: 'doc-1',
    name: 'Política_Contraseñas_2023.pdf',
    type: 'PDF',
    content: `
      POLÍTICA CORPORATIVA DE CONTRASEÑAS
      Versión: 2.1
      Fecha: 10/01/2023
      
      1. OBJETO
      Establecer los requisitos para la creación de contraseñas seguras.
      
      2. REQUISITOS
      - Las contraseñas deben ser cambiadas cada 90 días.
      - La longitud mínima requerida es de 6 caracteres. [INTENTIONAL ERROR FOR ISO 27001]
      - No se permite reutilizar las últimas 3 contraseñas.
      - Se recomienda el uso de números, pero no es obligatorio.
    `,
    processed: false
  },
  {
    id: 'doc-2',
    name: 'Procedimiento_Retencion_Datos.pdf',
    type: 'PDF',
    content: `
      PROCEDIMIENTO DE GESTIÓN Y RETENCIÓN DE DATOS
      Dpto: Legal & Compliance
      
      ...
      5. ALMACENAMIENTO DE DATOS DE CLIENTES
      Con el fin de mantener un histórico completo para futuros análisis de marketing, 
      todos los datos personales de clientes (incluyendo ex-clientes) se almacenarán 
      en la base de datos histórica de forma indefinida, a menos que el cliente solicite explícitamente su borrado. 
      [INTENTIONAL ERROR FOR GDPR: Data kept indefinitely by default]
    `,
    processed: false
  },
  {
    id: 'doc-3',
    name: 'Registro_Auditoria_Accesos_Oct23.log',
    type: 'Log',
    content: `
      SYSTEM ACCESS LOG - CRITICAL INFRASTRUCTURE
      Server: SRV-PROD-01
      Date: 2023-10-15
      
      08:00:01 - User: admin - Action: Login - Status: Success
      08:45:12 - User: jsmith - Action: Read /var/www/html - Status: Success
      09:15:00 - User: system - Action: Backup - Status: Started
      ...
      [Evidence of compliance for ISO A.12.6.1]
    `,
    processed: false
  },
  {
    id: 'doc-4',
    name: 'Manual_Empleado_Seguridad.pdf',
    type: 'PDF',
    content: `
      BUENAS PRÁCTICAS DE SEGURIDAD
      ...
      Bloqueo de Pantalla:
      Para evitar accesos no autorizados, configure su salvapantallas para activarse 
      automáticamente después de 15 minutos de inactividad.
      [INTENTIONAL ERROR FOR INTERNAL POLICY: 15 mins vs 5 mins required]
    `,
    processed: false
  }
];

// --- APP COMPONENT ---

const App = () => {
  // State
  const [activeTab, setActiveTab] = useState<'corpus' | 'audit' | 'report'>('corpus');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [progress, setProgress] = useState(0);

  // Stats
  const complianceStats = React.useMemo(() => {
    if (results.length === 0) return null;
    const total = results.length;
    const pass = results.filter(r => r.status === 'Cumple').length;
    const fail = results.filter(r => r.status === 'No Cumple').length;
    const partial = results.filter(r => r.status === 'Parcial').length;
    
    return {
      total,
      pass,
      fail,
      partial,
      score: Math.round(((pass + partial * 0.5) / total) * 100)
    };
  }, [results]);

  // --- ACTIONS ---

  const handleGenerateCorpus = () => {
    setProcessingStage('Generando documentos sintéticos...');
    setIsProcessing(true);
    setTimeout(() => {
      setDocuments(generateSyntheticCorpus());
      setIsProcessing(false);
      setProcessingStage('');
    }, 800);
  };

  const handleIngestion = () => {
    if (documents.length === 0) return;
    setIsProcessing(true);
    setProcessingStage('Ejecutando Pipeline OCR (Simulado)...');
    
    // Simulate OCR delay per document
    let processedCount = 0;
    const totalDocs = documents.length;
    
    const interval = setInterval(() => {
      processedCount++;
      setProgress((processedCount / totalDocs) * 100);
      
      if (processedCount >= totalDocs) {
        clearInterval(interval);
        setDocuments(prev => prev.map(d => ({ ...d, processed: true })));
        setIsProcessing(false);
        setProcessingStage('');
        setProgress(0);
      }
    }, 500);
  };

  const runAudit = async () => {
    if (!process.env.API_KEY) {
      alert("Por favor configura tu API KEY de Google Gemini.");
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setActiveTab('audit');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullContext = documents.map(d => `Documento: ${d.name}\nContenido:\n${d.content}`).join('\n\n---\n\n');

    let completed = 0;
    const newResults: AuditResult[] = [];

    for (const reg of MOCK_REGULATIONS) {
      setProcessingStage(`Analizando: ${reg.standard} - ${reg.control}...`);
      
      try {
        const prompt = `
          ACTÚA COMO: Auditor experto en ciberseguridad y cumplimiento normativo (GRC).
          TAREA: Evaluar el cumplimiento del siguiente requisito normativo basándote ÚNICAMENTE en la evidencia documental proporcionada.
          
          REQUISITO A VERIFICAR:
          Norma: ${reg.standard}
          Control: ${reg.control}
          Descripción: "${reg.requirement}"

          EVIDENCIA DOCUMENTAL (Corpus):
          ${fullContext}

          INSTRUCCIONES:
          1. Busca en el texto evidencia que confirme o contradiga el requisito.
          2. Sé estricto. Si la política dice "6 caracteres" y el requisito es "8", es un INCUMPLIMIENTO.
          3. Si no hay información suficiente, marca como "No Aplica" o "No hay evidencia".

          SALIDA ESPERADA (JSON):
          {
            "status": "Cumple" | "No Cumple" | "Parcial" | "No Aplica",
            "justification": "Explicación breve y técnica del hallazgo.",
            "evidence": "Cita textual del fragmento del documento que justifica la decisión."
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, enum: ["Cumple", "No Cumple", "Parcial", "No Aplica"] },
                justification: { type: Type.STRING },
                evidence: { type: Type.STRING }
              }
            }
          }
        });

        const json = JSON.parse(response.text || '{}');
        
        newResults.push({
          regulationId: reg.id,
          status: json.status || 'No Aplica',
          justification: json.justification || 'Error al analizar',
          evidence: json.evidence || 'N/A',
          timestamp: Date.now()
        });

      } catch (e) {
        console.error(e);
        newResults.push({
          regulationId: reg.id,
          status: 'No Aplica',
          justification: 'Error técnico en el análisis LLM',
          evidence: '',
          timestamp: Date.now()
        });
      }

      completed++;
      setProgress((completed / MOCK_REGULATIONS.length) * 100);
      setResults([...newResults]); // Update UI progressively
    }

    setIsProcessing(false);
    setProcessingStage('');
    setProgress(0);
    setActiveTab('report');
  };

  // --- RENDERERS ---

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Cumple': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Cumple</span>;
      case 'No Cumple': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> No Cumple</span>;
      case 'Parcial': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" /> Parcial</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No Determinado</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">AuditAI <span className="text-blue-600">Local</span></h1>
              <p className="text-xs text-gray-500 font-mono">TFM Prototype v0.9.2 (Web Simulation)</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('corpus')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'corpus' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              1. Ingesta & Corpus
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'audit' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              2. Motor de Auditoría
            </button>
            <button 
              onClick={() => setActiveTab('report')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'report' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              3. Informes
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PROCESSING OVERLAY */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex flex-col items-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{processingStage}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Procesando con Gemini 2.5 Flash...<br/>
                  <span className="text-xs opacity-75">Simulando ejecución LLM local (Ollama)</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CORPUS */}
        {activeTab === 'corpus' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Módulo 1: Generación de Corpus Sintético</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Este módulo simula la creación de documentos empresariales con "fallos intencionales" para probar la capacidad de detección del agente.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleGenerateCorpus}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Generar Datos de Prueba
                  </button>
                  <button 
                    onClick={handleIngestion}
                    disabled={documents.length === 0 || documents[0].processed}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Ejecutar Ingesta OCR
                  </button>
                </div>
              </div>

              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white relative group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 p-2 rounded text-red-600">
                            {doc.type === 'PDF' ? <FileText className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type} • {doc.content.length} caracteres</p>
                          </div>
                        </div>
                        {doc.processed && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-600 h-32 overflow-y-auto whitespace-pre-wrap border border-gray-100">
                        {doc.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No hay documentos cargados</p>
                  <p className="text-gray-400 text-sm mt-1">Haz clic en "Generar Datos de Prueba" para iniciar la simulación.</p>
                </div>
              )}
            </div>

            {documents.length > 0 && documents[0].processed && (
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('audit')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-medium transition-transform transform hover:-translate-y-0.5"
                >
                  Continuar a Auditoría <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Regulations */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                    Marco Normativo
                  </h2>
                  <div className="space-y-3">
                    {MOCK_REGULATIONS.map(reg => {
                      const result = results.find(r => r.regulationId === reg.id);
                      return (
                        <div key={reg.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{reg.standard}</span>
                            {result && renderStatusBadge(result.status)}
                          </div>
                          <p className="text-sm font-medium text-gray-800 mt-1">{reg.control}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reg.requirement}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                    <button 
                      onClick={runAudit}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                      {isProcessing ? 'Auditando...' : 'Ejecutar Agente de Auditoría'}
                      {!isProcessing && <Play className="w-4 h-4" />}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-3">
                      Utiliza Gemini 2.5 Flash para razonar sobre los documentos cargados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel: Live Results */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px] flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-gray-500" />
                    Registro de Razonamiento del Agente
                  </h2>
                  
                  {results.length > 0 ? (
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      {results.map((res, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-2 mb-2">
                            {renderStatusBadge(res.status)}
                            <span className="text-xs text-gray-400">Hace {Math.round((Date.now() - res.timestamp)/1000)}s</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {MOCK_REGULATIONS.find(r => r.id === res.regulationId)?.control}: {MOCK_REGULATIONS.find(r => r.id === res.regulationId)?.requirement}
                          </p>
                          
                          <div className="bg-gray-50 p-3 rounded-md mb-2">
                            <p className="text-sm text-gray-700 font-medium">Justificación:</p>
                            <p className="text-sm text-gray-600">{res.justification}</p>
                          </div>

                          {res.evidence && res.evidence !== 'N/A' && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                              <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Evidencia Detectada:</p>
                              <p className="text-sm text-gray-700 italic font-serif">"{res.evidence}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <Cpu className="w-16 h-16 mb-4 opacity-20" />
                      <p>Esperando ejecución...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REPORT */}
        {activeTab === 'report' && complianceStats && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cumple', value: complianceStats.pass },
                          { name: 'No Cumple', value: complianceStats.fail },
                          { name: 'Parcial', value: complianceStats.partial }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="pass" fill="#22c55e" />
                        <Cell key="fail" fill="#ef4444" />
                        <Cell key="part" fill="#eab308" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-gray-900">{complianceStats.score}%</span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-500">Cumplimiento Global</h3>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-3">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen Ejecutivo</h3>
                <div className="space-y-3">
                  {results.filter(r => r.status === 'No Cumple').length > 0 ? (
                    results.filter(r => r.status === 'No Cumple').map(r => (
                       <div key={r.regulationId} className="flex gap-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                         <div className="flex-shrink-0">
                           <AlertTriangle className="w-5 h-5 text-red-600" />
                         </div>
                         <div>
                           <h4 className="text-sm font-bold text-red-900">
                             Hallazgo Crítico: {MOCK_REGULATIONS.find(reg => reg.id === r.regulationId)?.standard}
                           </h4>
                           <p className="text-sm text-red-800 mt-1">{r.justification}</p>
                           <p className="text-xs text-red-600 mt-2 font-mono bg-red-100 p-1 rounded inline-block">
                             Evidencia: {r.evidence}
                           </p>
                         </div>
                       </div>
                    ))
                  ) : (
                    <div className="p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Excelente. No se detectaron incumplimientos críticos.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Matrix */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Matriz de Cumplimiento Detallada</h3>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  <Download className="w-4 h-4" /> Exportar CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Norma / Control</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justificación Técnica</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidencia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((res) => {
                      const reg = MOCK_REGULATIONS.find(r => r.id === res.regulationId);
                      return (
                        <tr key={res.regulationId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{reg?.standard}</div>
                            <div className="text-sm text-gray-500">{reg?.control}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatusBadge(res.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={res.justification}>
                            {res.justification}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate" title={res.evidence}>
                            {res.evidence}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && !complianceStats && (
           <div className="text-center py-12">
             <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">No hay datos de auditoría disponibles.</p>
             <button onClick={() => setActiveTab('audit')} className="text-blue-600 font-medium hover:underline mt-2">Ir a ejecutar auditoría</button>
           </div>
        )}

      </main>
    </div>
  );
};

// --- BOOTSTRAP ---
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
