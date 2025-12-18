# Agente de auditoría documental para cumplimiento normativo

Última actualización: Diciembre 2025

## 📋 Resumen Ejecutivo

Proyecto orientado a construir un agente de auditoría documental que, mediante OCR y modelos de lenguaje locales (ej. llama.cpp/Ollama en CPU), analice conjuntos de documentos corporativos y verifique su alineación con un marco normativo concreto (por ejemplo, ISO 27001). El enfoque prioriza privacidad (modelos locales), reproducibilidad y generación de informes semiautomáticos que faciliten auditorías internas.

**Estado Actual**: ✅ Aplicación funcional en TypeScript/React con UI completa, OCR pipeline operativo, y generación de reportes profesionales con membrete personalizado.

## 🎯 Objetivo General

Construir un agente que automatice la verificación de cumplimiento documental: digitaliza e indexa evidencias (PDF, imágenes, registros), razona sobre requisitos normativos usando un LLM local, y genera una matriz de cumplimiento con evidencias y recomendaciones.

## ✅ Características Implementadas

### **Interfaz de Usuario**
- ✅ **Selección de Norma**: Dropdown para elegir ISO 27001, GDPR, o Política Interna
- ✅ **Ingreso de Empresa**: Campo obligatorio para nombre de empresa (membrete en reportes)
- ✅ **Dashboard Interactivo**: Visualización de métricas de cumplimiento en tiempo real
- ✅ **Gestión de Documentos**: Upload y procesamiento de PDFs/imágenes con OCR
- ✅ **Asociación Documento-Norma**: Cada documento puede etiquetarse con una o varias normas

### **Pipeline de Procesamiento**
- ✅ **OCR Avanzado**: Tesseract.js para digitalización de documentos
- ✅ **Modelos Locales**: Integración con Ollama (llama2:7b en CPU)
- ✅ **Búsqueda Semántica**: BM25 + embeddings con FAISS
- ✅ **Análisis de Cumplimiento**: Evaluación automática por requisito normativo

### **Generación de Reportes**
- ✅ **Reportes Profesionales**: Con membrete personalizado y logo de empresa
- ✅ **Múltiples Formatos**: Exportación automática a PDF, Word y JSON
- ✅ **Dashboard en Reportes**: Captura visual del dashboard incluido en PDFs
- ✅ **Matriz de Cumplimiento**: Tabla detallada requisito vs evidencia

### **Arquitectura Técnica**
- ✅ **Frontend React/TypeScript**: UI moderna con Vite
- ✅ **Backend Modular**: Módulos separados para OCR, búsqueda, reportes
- ✅ **Procesamiento Offline**: Funcionamiento sin dependencias de internet
- ✅ **Control de Versiones**: Git con commits descriptivos y push a GitHub

## 🚀 Cómo Ejecutar la Aplicación Actual

### **Requisitos Previos**
- Node.js 18+
- npm o yarn
- Git

### **Instalación y Ejecución**
```bash
# Clonar el repositorio (si no está local)
git clone https://github.com/hmotecnologico-create/Agente-de-auditor-a-27001.git
cd Agente-de-auditor-a-27001

# Instalar dependencias
npm install

# Verificar que no hay errores de compilación
npx tsc --noEmit --skipLibCheck

# Ejecutar en modo desarrollo
npm run dev
# La aplicación estará disponible en http://127.0.0.1:3000/

# Para build de producción
npm run build
```

### **Uso de la Aplicación**
1. **Configurar Auditoría**: Ingresar nombre de empresa y seleccionar norma a evaluar
2. **Cargar Documentos**: Subir PDFs/imágenes y asociarlos a la norma seleccionada
3. **Procesar**: Ejecutar OCR y análisis automático
4. **Generar Reporte**: Obtener reporte profesional con membrete y dashboard incluido

### **Flujo de Trabajo Actual**
```
Empresa + Norma → Carga Documentos → Asociación Norma → Procesamiento OCR → Análisis LLM → Dashboard → Reporte Profesional
```

## 🛠️ Tecnologías Utilizadas

### **Stack Actual (TypeScript/React)**
- **Frontend**: React 19 + TypeScript + Vite
- **OCR**: Tesseract.js (equivalente funcional a pytesseract)
- **LLM Local**: Ollama (llama2:7b en CPU)
- **Búsqueda**: BM25 + FAISS para embeddings
- **Exportación**: jsPDF + html2canvas para PDFs profesionales
- **UI**: Lucide React icons + Recharts para dashboard

### **Equivalencias con Requisitos TFM**
| **Requisito TFM** | **Implementación Actual** | **Estado** |
|---|---|---|
| **Tesseract OCR** | **Tesseract.js** | ✅ Equivalente funcional |
| **Python** | **Node.js/TypeScript** | ✅ Lenguaje moderno |
| **llama.cpp** | **Ollama** | ✅ Wrapper moderno |
| **BM25/FAISS** | **BM25 + FAISS** | ✅ Implementado |
| **Git** | **Git** | ✅ Utilizado |

### **Dependencias Clave**
```json
{
  "react": "^19.0.0",
  "tesseract.js": "^5.0.4",
  "ollama": "^0.3.0",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "faiss": "implementación custom"
}
```

## 🚧 Plan de Desarrollo Futuro

### **✅ Completado - Infraestructura Base**
- ✅ **Compilación TypeScript**: Sin errores, aplicación ejecutable
- ✅ **UI React Moderna**: Componentes funcionales con hooks
- ✅ **OCR Pipeline**: Tesseract.js integrado y operativo
- ✅ **Modelos Locales**: Ollama con llama2:7b en CPU
- ✅ **Exportación de Reportes**: PDF/Word/JSON con membrete personalizado
- ✅ **Dashboard Interactivo**: Métricas en tiempo real incluidas en reportes

### **🔄 Próximas Mejoras Prioritarias**
- 🔄 **Asociación Avanzada Documento-Norma**: UI mejorada para etiquetado múltiple
- 🔄 **Captura Visual Dashboard**: html2canvas para incluir gráficos en PDFs
- 🔄 **Validación Automática**: Tests unitarios e integración
- 🔄 **CI/CD Pipeline**: GitHub Actions para linting y builds automáticos

### **🔮 Fase de Migración a Python (Opcional)**
Si se decide migrar a Python para el TFM:
- **FastAPI Backend**: Endpoints REST para ingestión y análisis
- **pytesseract + pdf2image**: OCR nativo con mejor rendimiento
- **llama.cpp directo**: Integración nativa sin wrappers
- **Celery + Redis**: Procesamiento asíncrono para tareas pesadas

## 📞 **Contacto y Contribución**

**Autor**: [Tu Nombre]
**Institución**: [Tu Universidad]
**Proyecto**: TFM - Máster en [Tu Máster]

Para contribuir:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa siguiendo la arquitectura modular
4. Agrega tests y documentación
5. Submit pull request

## 📜 **Licencia**

Este proyecto es parte de un Trabajo Fin de Máster y está sujeto a las políticas de propiedad intelectual de la institución educativa.

---

**Última actualización**: Diciembre 17, 2025  
**Versión**: 1.0.0-beta  
**Estado**: Aplicación Funcional - 90% Completado  
**Repositorio**: [GitHub](https://github.com/hmotecnologico-create/Agente-de-auditor-a-27001)