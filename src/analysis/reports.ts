// Report Export Module - Professional PDF and Word Generation
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ProfessionalReportData {
  title: string;
  subtitle?: string;
  date: string;
  author?: string;
  company: string;
  executiveSummary: ExecutiveSummary;
  sections: ProfessionalReportSection[];
  metadata: ReportMetadata;
  modules: ModuleReport[];
}

export interface ExecutiveSummary {
  overallScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  keyFindings: string[];
  priorityActions: string[];
  complianceTrend: 'Improving' | 'Stable' | 'Declining';
}

export interface ProfessionalReportSection {
  title: string;
  subtitle?: string;
  content: string | any[];
  type: 'executive' | 'detailed' | 'technical' | 'recommendations' | 'charts' | 'table' | 'metrics';
  level?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface ReportMetadata {
  totalDocuments: number;
  processingTime: number;
  auditDate: string;
  reportVersion: string;
  confidentiality: 'Internal' | 'Confidential' | 'Restricted';
  generatedBy: string;
}

export interface ModuleReport {
  name: string;
  status: 'success' | 'warning' | 'error' | 'not_run';
  score?: number;
  findings: string[];
  metrics: Record<string, any>;
  recommendations: string[];
}

export class ProfessionalReportExporter {
  private static instance: ProfessionalReportExporter;

  static getInstance(): ProfessionalReportExporter {
    if (!ProfessionalReportExporter.instance) {
      ProfessionalReportExporter.instance = new ProfessionalReportExporter();
    }
    return ProfessionalReportExporter.instance;
  }

  async exportProfessionalReport(
    reportData: ProfessionalReportData,
    format: 'pdf' | 'word' | 'json',
    filename?: string
  ): Promise<void> {
    try {
      console.log(`📄 Generando reporte profesional en ${format.toUpperCase()}...`);

      switch (format) {
        case 'pdf':
          await this.exportProfessionalToPDF(reportData, filename);
          break;
        case 'word':
          await this.exportProfessionalToWord(reportData, filename);
          break;
        case 'json':
          await this.exportProfessionalToJSON(reportData, filename);
          break;
      }

      console.log(`✅ Reporte profesional generado: ${filename || 'reporte_profesional'}.${format}`);

    } catch (error) {
      console.error('❌ Error generando reporte profesional:', error);
      throw new Error(`Error en exportación profesional: ${error}`);
    }
  }

  private async exportProfessionalToPDF(
    reportData: ProfessionalReportData,
    filename?: string
  ): Promise<void> {
    try {
      console.log('📄 Generando PDF profesional...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

    // Configuración de fuente
    pdf.setFont('helvetica', 'normal');

    // Portada profesional
    yPosition = this.addProfessionalCoverPage(pdf, reportData, pageWidth, pageHeight, margin, yPosition);

    // Resumen Ejecutivo
    pdf.addPage();
    yPosition = margin;
    yPosition = this.addExecutiveSummary(pdf, reportData.executiveSummary, pageWidth, pageHeight, margin, yPosition);

    // Reportes por módulo
    reportData.modules.forEach(module => {
      pdf.addPage();
      yPosition = margin;
      yPosition = this.addModuleReport(pdf, module, pageWidth, pageHeight, margin, yPosition);
    });

    // Secciones detalladas
    reportData.sections.forEach(section => {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }
      yPosition = this.addProfessionalSection(pdf, section, yPosition, pageWidth, pageHeight, margin);
    });

    // Pie de página en todas las páginas
    this.addProfessionalFooter(pdf, reportData, pageWidth, pageHeight);

    // Descargar
    const finalFilename = filename || `reporte_profesional_${reportData.company.replace(/\s+/g, '_')}_${Date.now()}`;
    pdf.save(`${finalFilename}.pdf`);

    console.log(`✅ PDF profesional generado: ${finalFilename}.pdf`);

    } catch (error) {
      console.error('❌ Error generando PDF profesional:', error);
      throw new Error(`Error en exportación PDF profesional: ${error}`);
    }
  }

  private addProfessionalCoverPage(
    pdf: jsPDF,
    reportData: ProfessionalReportData,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    yPosition: number
  ): number {
    // Logo/título principal
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80); // Dark blue
    const titleLines = pdf.splitTextToSize(reportData.title, pageWidth - 2 * margin);
    pdf.text(titleLines, pageWidth / 2, yPosition + 30, { align: 'center' });
    yPosition += titleLines.length * 15 + 20;

    // Subtítulo
    if (reportData.subtitle) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(52, 73, 94);
      const subtitleLines = pdf.splitTextToSize(reportData.subtitle, pageWidth - 2 * margin);
      pdf.text(subtitleLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += subtitleLines.length * 8 + 30;
    }

    // Información de la empresa
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Empresa:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.company, margin + 35, yPosition);
    yPosition += 15;

    // Fecha y autor
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fecha:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.date, margin + 25, yPosition);
    yPosition += 15;

    if (reportData.author) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Autor:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.author, margin + 20, yPosition);
      yPosition += 15;
    }

    // Clasificación de confidencialidad
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(231, 76, 60); // Red
    pdf.text('Confidencialidad:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.metadata.confidentiality, margin + 45, yPosition);

    // Versión del reporte
    yPosition += 30;
    pdf.setFontSize(10);
    pdf.setTextColor(127, 140, 141); // Gray
    pdf.text(`Versión: ${reportData.metadata.reportVersion}`, margin, pageHeight - 30);
    pdf.text(`Generado por: ${reportData.metadata.generatedBy}`, margin, pageHeight - 20);

    return yPosition;
  }

  private addExecutiveSummary(
    pdf: jsPDF,
    summary: ExecutiveSummary,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    yPosition: number
  ): number {
    // Título del resumen ejecutivo
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('RESUMEN EJECUTIVO', margin, yPosition);
    yPosition += 20;

    // Puntuación general
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Puntuación General de Cumplimiento:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${summary.overallScore}%`, margin + 120, yPosition);
    yPosition += 15;

    // Nivel de riesgo
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nivel de Riesgo:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    const riskColor = summary.riskLevel === 'Low' ? [46, 204, 113] :
                     summary.riskLevel === 'Medium' ? [241, 196, 15] :
                     summary.riskLevel === 'High' ? [230, 126, 34] : [231, 76, 60];
    pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.text(summary.riskLevel, margin + 50, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;

    // Tendencia
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tendencia:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(summary.complianceTrend, margin + 35, yPosition);
    yPosition += 25;

    // Hallazgos clave
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('HALLAZGOS CLAVE:', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    summary.keyFindings.forEach(finding => {
      const lines = pdf.splitTextToSize(`• ${finding}`, pageWidth - 2 * margin - 10);
      pdf.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 5 + 3;
    });

    yPosition += 15;

    // Acciones prioritarias
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('ACCIONES PRIORITARIAS:', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    summary.priorityActions.forEach(action => {
      const lines = pdf.splitTextToSize(`• ${action}`, pageWidth - 2 * margin - 10);
      pdf.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 5 + 3;
    });

    return yPosition + 20;
  }

  private addModuleReport(
    pdf: jsPDF,
    module: ModuleReport,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    yPosition: number
  ): number {
    // Título del módulo
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text(`MÓDULO: ${module.name.toUpperCase()}`, margin, yPosition);
    yPosition += 15;

    // Estado del módulo
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Estado:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    const statusColor = module.status === 'success' ? [46, 204, 113] :
                       module.status === 'warning' ? [241, 196, 15] :
                       module.status === 'error' ? [231, 76, 60] : [149, 165, 166];
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(module.status.toUpperCase(), margin + 25, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;

    // Puntuación si aplica
    if (module.score !== undefined) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Puntuación:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${module.score}%`, margin + 35, yPosition);
      yPosition += 15;
    }

    // Métricas
    if (Object.keys(module.metrics).length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('MÉTRICAS:', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      Object.entries(module.metrics).forEach(([key, value]) => {
        pdf.text(`${key}:`, margin + 5, yPosition);
        pdf.text(String(value), margin + 80, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Hallazgos
    if (module.findings.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('HALLAZGOS:', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      module.findings.forEach(finding => {
        const lines = pdf.splitTextToSize(`• ${finding}`, pageWidth - 2 * margin - 10);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4 + 2;
      });
      yPosition += 10;
    }

    // Recomendaciones
    if (module.recommendations.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('RECOMENDACIONES:', margin, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      module.recommendations.forEach(rec => {
        const lines = pdf.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 10);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4 + 2;
      });
    }

    return yPosition + 20;
  }

  private addProfessionalSection(
    pdf: jsPDF,
    section: ProfessionalReportSection,
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    // Título de sección
    const fontSize = section.level === 1 ? 16 : section.level === 2 ? 14 : 12;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');

    // Color basado en prioridad
    const titleColor = section.priority === 'high' ? [231, 76, 60] :
                      section.priority === 'medium' ? [241, 196, 15] : [44, 62, 80];
    pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);

    const titleLines = pdf.splitTextToSize(section.title, pageWidth - 2 * margin);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * (fontSize / 3) + 5;

    // Subtítulo si existe
    if (section.subtitle) {
      pdf.setFontSize(fontSize - 2);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(127, 140, 141);
      const subtitleLines = pdf.splitTextToSize(section.subtitle, pageWidth - 2 * margin);
      pdf.text(subtitleLines, margin, yPosition);
      yPosition += subtitleLines.length * ((fontSize - 2) / 3) + 8;
    }

    // Reset color
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // Contenido según tipo
    switch (section.type) {
      case 'executive':
      case 'detailed':
      case 'technical':
        if (typeof section.content === 'string') {
          const textLines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin);
          pdf.text(textLines, margin, yPosition);
          yPosition += textLines.length * 4 + 10;
        }
        break;

      case 'recommendations':
        if (Array.isArray(section.content)) {
          section.content.forEach((item: any, index: number) => {
            const itemText = typeof item === 'string' ? item : item.text || item.toString();
            const priority = item.priority || section.priority;
            const bullet = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
            const bulletText = `${bullet} ${itemText}`;
            const lines = pdf.splitTextToSize(bulletText, pageWidth - 2 * margin - 10);

            if (yPosition + lines.length * 4 > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.text(lines, margin + 5, yPosition);
            yPosition += lines.length * 4 + 2;
          });
          yPosition += 5;
        }
        break;

      case 'table':
        if (Array.isArray(section.content) && section.content.length > 0) {
          yPosition = this.addProfessionalTableToPDF(pdf, section.content, yPosition, pageWidth, pageHeight, margin);
        }
        break;

      case 'metrics':
        if (typeof section.content === 'object') {
          yPosition = this.addMetricsToPDF(pdf, section.content, yPosition, pageWidth, pageHeight, margin);
        }
        break;

      default:
        pdf.text('[Contenido no soportado]', margin, yPosition);
        yPosition += 10;
    }

    return yPosition;
  }

  private addProfessionalTableToPDF(
    pdf: jsPDF,
    data: any[],
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    if (data.length === 0) return yPosition;

    const rowHeight = 8;
    const colWidth = (pageWidth - 2 * margin) / Object.keys(data[0]).length;

    // Encabezados con estilo profesional
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setFillColor(240, 240, 240);
    let xPos = margin;

    Object.keys(data[0]).forEach(header => {
      pdf.rect(xPos, yPosition - 5, colWidth, rowHeight, 'F');
      pdf.text(header, xPos + 2, yPosition);
      xPos += colWidth;
    });

    yPosition += rowHeight;

    // Línea separadora
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    // Filas de datos
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    data.forEach((row, rowIndex) => {
      if (yPosition + rowHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // Alternar colores de fila
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight, 'F');
      }

      xPos = margin;
      Object.values(row).forEach((cell: any) => {
        const cellText = String(cell);
        const truncatedText = cellText.length > 20 ? cellText.substring(0, 17) + '...' : cellText;
        pdf.text(truncatedText, xPos + 2, yPosition + 3);
        xPos += colWidth;
      });

      yPosition += rowHeight;

      // Línea entre filas
      pdf.setDrawColor(240, 240, 240);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    });

    return yPosition + 10;
  }

  private addMetricsToPDF(
    pdf: jsPDF,
    metrics: Record<string, any>,
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    Object.entries(metrics).forEach(([key, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${key}:`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(value), margin + 60, yPosition);
      yPosition += 6;
    });

    return yPosition + 10;
  }

  private addProfessionalFooter(
    pdf: jsPDF,
    reportData: ProfessionalReportData,
    pageWidth: number,
    pageHeight: number
  ): void {
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(127, 140, 141);

      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      // Información del pie
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(reportData.metadata.generatedBy, margin, pageHeight - 10);
      pdf.text(`Confidencial - ${reportData.metadata.confidentiality}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  }

  private async exportProfessionalToWord(
    reportData: ProfessionalReportData,
    filename?: string
  ): Promise<void> {
    const htmlContent = this.generateProfessionalWordHTML(reportData);

    const blob = new Blob([htmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `reporte_profesional_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private generateProfessionalWordHTML(reportData: ProfessionalReportData): string {
    const modulesHTML = reportData.modules.map(module => `
      <h2>Módulo: ${module.name}</h2>
      <p><strong>Estado:</strong> ${module.status}</p>
      ${module.score !== undefined ? `<p><strong>Puntuación:</strong> ${module.score}%</p>` : ''}
      ${Object.keys(module.metrics).length > 0 ? `
        <h3>Métricas</h3>
        <ul>${Object.entries(module.metrics).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}</ul>
      ` : ''}
      ${module.findings.length > 0 ? `
        <h3>Hallazgos</h3>
        <ul>${module.findings.map(f => `<li>${f}</li>`).join('')}</ul>
      ` : ''}
      ${module.recommendations.length > 0 ? `
        <h3>Recomendaciones</h3>
        <ul>${module.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
    `).join('');

    const sectionsHTML = reportData.sections.map(section => {
      const titleTag = section.level === 1 ? 'h1' : section.level === 2 ? 'h2' : 'h3';
      let contentHTML = '';

      switch (section.type) {
        case 'executive':
        case 'detailed':
        case 'technical':
          contentHTML = `<p>${section.content}</p>`;
          break;
        case 'recommendations':
          if (Array.isArray(section.content)) {
            contentHTML = '<ul>';
            section.content.forEach((item: any) => {
              const priority = item.priority || section.priority;
              const icon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
              contentHTML += `<li>${icon} ${item}</li>`;
            });
            contentHTML += '</ul>';
          }
          break;
        case 'table':
          if (Array.isArray(section.content) && section.content.length > 0) {
            contentHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
            contentHTML += '<tr>';
            Object.keys(section.content[0]).forEach(header => {
              contentHTML += `<th style="padding: 5px; background-color: #f0f0f0;">${header}</th>`;
            });
            contentHTML += '</tr>';
            section.content.forEach((row: any) => {
              contentHTML += '<tr>';
              Object.values(row).forEach((cell: any) => {
                contentHTML += `<td style="padding: 5px;">${cell}</td>`;
              });
              contentHTML += '</tr>';
            });
            contentHTML += '</table>';
          }
          break;
      }

      return `<${titleTag}>${section.title}</${titleTag}>${contentHTML}`;
    }).join('');

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${reportData.title}</title>
        <style>
          body { font-family: 'Calibri', Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; font-size: 24px; }
          h2 { color: #34495e; margin-top: 30px; font-size: 18px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
          h3 { color: #7f8c8d; margin-top: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .executive-summary { background-color: #ecf0f1; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #3498db; }
          .module-report { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .high-priority { color: #e74c3c; font-weight: bold; }
          .medium-priority { color: #f39c12; font-weight: bold; }
          .low-priority { color: #27ae60; font-weight: bold; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #bdc3c7; font-size: 10px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>${reportData.title}</h1>
        ${reportData.subtitle ? `<h2>${reportData.subtitle}</h2>` : ''}

        <div class="executive-summary">
          <h2>Resumen Ejecutivo</h2>
          <p><strong>Puntuación General:</strong> ${reportData.executiveSummary.overallScore}%</p>
          <p><strong>Nivel de Riesgo:</strong> ${reportData.executiveSummary.riskLevel}</p>
          <p><strong>Tendencia:</strong> ${reportData.executiveSummary.complianceTrend}</p>

          <h3>Hallazgos Clave</h3>
          <ul>${reportData.executiveSummary.keyFindings.map(f => `<li>${f}</li>`).join('')}</ul>

          <h3>Acciones Prioritarias</h3>
          <ul>${reportData.executiveSummary.priorityActions.map(a => `<li>${a}</li>`).join('')}</ul>
        </div>

        <h2>Reportes por Módulo</h2>
        ${modulesHTML}

        ${sectionsHTML}

        <div class="footer">
          <p><strong>Reporte generado por:</strong> ${reportData.metadata.generatedBy}</p>
          <p><strong>Fecha:</strong> ${reportData.metadata.auditDate}</p>
          <p><strong>Versión:</strong> ${reportData.metadata.reportVersion}</p>
          <p><strong>Confidencialidad:</strong> ${reportData.metadata.confidentiality}</p>
          <p><strong>Tiempo de procesamiento:</strong> ${reportData.metadata.processingTime}ms</p>
        </div>
      </body>
      </html>
    `;
  }

  private async exportProfessionalToJSON(
    reportData: ProfessionalReportData,
    filename?: string
  ): Promise<void> {
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `reporte_profesional_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async exportProfessionalToPDF(
    reportData: ProfessionalReportData,
    filename?: string
  ): Promise<void> {
    try {
      console.log('📄 Generando PDF...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Configuración de fuente
      pdf.setFont('helvetica', 'normal');

      // Título principal
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(reportData.title, pageWidth - 2 * margin);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 7 + 5;

      // Subtítulo
      if (reportData.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        const subtitleLines = pdf.splitTextToSize(reportData.subtitle, pageWidth - 2 * margin);
        pdf.text(subtitleLines, margin, yPosition);
        yPosition += subtitleLines.length * 5 + 10;
      }

      // Metadatos
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Fecha: ${reportData.date}`, margin, yPosition);
      if (reportData.author) {
        pdf.text(`Autor: ${reportData.author}`, pageWidth - margin, yPosition, { align: 'right' });
      }
      yPosition += 10;

      // Información del reporte
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Documentos Analizados: ${reportData.metadata.totalDocuments}`, margin, yPosition);
      pdf.text(`Puntuación de Cumplimiento: ${reportData.metadata.complianceScore.toFixed(1)}%`, margin, yPosition + 5);
      pdf.text(`Nivel de Riesgo: ${reportData.metadata.riskLevel}`, margin, yPosition + 10);
      pdf.text(`Tiempo de Procesamiento: ${reportData.metadata.processingTime}ms`, margin, yPosition + 15);
      yPosition += 25;

      // Procesar secciones
      for (const section of reportData.sections) {
        yPosition = this.addSectionToPDF(pdf, section, yPosition, pageWidth, pageHeight, margin);

        // Nueva página si es necesario
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
      }

      // Pie de página
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('Generado por Agente de Auditoría ISO 27001', margin, pageHeight - 10);
        pdf.text(new Date().toLocaleString(), pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      // Descargar
      const finalFilename = filename || `reporte_auditoria_${Date.now()}.pdf`;
      pdf.save(finalFilename);

      console.log(`✅ PDF generado: ${finalFilename}`);

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw new Error(`Error en exportación PDF: ${error}`);
    }
  }

  private addSectionToPDF(
    pdf: jsPDF,
    section: ReportSection,
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    // Título de sección
    const fontSize = section.level === 1 ? 16 : section.level === 2 ? 14 : 12;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', section.level === 1 ? 'bold' : 'bold');

    const titleLines = pdf.splitTextToSize(section.title, pageWidth - 2 * margin);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * (fontSize / 3) + 5;

    // Contenido según tipo
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    switch (section.type) {
      case 'text':
        if (typeof section.content === 'string') {
          const textLines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin);
          pdf.text(textLines, margin, yPosition);
          yPosition += textLines.length * 4 + 10;
        }
        break;

      case 'list':
        if (Array.isArray(section.content)) {
          section.content.forEach((item: any, index: number) => {
            const itemText = typeof item === 'string' ? item : item.text || item.toString();
            const bulletText = `• ${itemText}`;
            const lines = pdf.splitTextToSize(bulletText, pageWidth - 2 * margin - 10);

            // Verificar si cabe en la página
            if (yPosition + lines.length * 4 > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.text(lines, margin + 5, yPosition);
            yPosition += lines.length * 4 + 2;
          });
          yPosition += 5;
        }
        break;

      case 'table':
        if (Array.isArray(section.content) && section.content.length > 0) {
          yPosition = this.addTableToPDF(pdf, section.content, yPosition, pageWidth, pageHeight, margin);
        }
        break;

      default:
        pdf.text('[Contenido no soportado]', margin, yPosition);
        yPosition += 10;
    }

    return yPosition;
  }

  private addTableToPDF(
    pdf: jsPDF,
    data: any[],
    yPosition: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): number {
    if (data.length === 0) return yPosition;

    const rowHeight = 8;
    const colWidth = (pageWidth - 2 * margin) / Object.keys(data[0]).length;

    // Encabezados
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    let xPos = margin;

    Object.keys(data[0]).forEach(header => {
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += colWidth;
    });

    // Línea separadora
    pdf.line(margin, yPosition + 7, pageWidth - margin, yPosition + 7);
    yPosition += rowHeight;

    // Filas de datos
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    data.forEach((row, rowIndex) => {
      // Verificar si cabe en la página
      if (yPosition + rowHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      xPos = margin;
      Object.values(row).forEach((cell: any) => {
        const cellText = String(cell);
        const truncatedText = cellText.length > 15 ? cellText.substring(0, 12) + '...' : cellText;
        pdf.text(truncatedText, xPos + 2, yPosition + 5);
        xPos += colWidth;
      });

      yPosition += rowHeight;

      // Línea entre filas
      if (rowIndex < data.length - 1) {
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      }
    });

    return yPosition + 10;
  }

  async exportToWord(reportData: ReportData, filename?: string): Promise<void> {
    try {
      console.log('📝 Generando documento Word...');

      // Crear contenido HTML para Word
      const htmlContent = this.generateWordHTML(reportData);

      // Crear blob y descargar
      const blob = new Blob([htmlContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `reporte_auditoria_${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Documento Word generado: ${a.download}`);

    } catch (error) {
      console.error('❌ Error generando Word:', error);
      throw new Error(`Error en exportación Word: ${error}`);
    }
  }

  private generateWordHTML(reportData: ReportData): string {
    const sectionsHTML = reportData.sections.map(section => {
      const titleTag = section.level === 1 ? 'h1' : section.level === 2 ? 'h2' : 'h3';

      let contentHTML = '';
      switch (section.type) {
        case 'text':
          contentHTML = `<p>${section.content}</p>`;
          break;
        case 'list':
          if (Array.isArray(section.content)) {
            contentHTML = '<ul>';
            section.content.forEach((item: any) => {
              const itemText = typeof item === 'string' ? item : item.text || item.toString();
              contentHTML += `<li>${itemText}</li>`;
            });
            contentHTML += '</ul>';
          }
          break;
        case 'table':
          if (Array.isArray(section.content) && section.content.length > 0) {
            contentHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
            // Encabezados
            contentHTML += '<tr>';
            Object.keys(section.content[0]).forEach(header => {
              contentHTML += `<th style="padding: 5px; background-color: #f0f0f0;">${header}</th>`;
            });
            contentHTML += '</tr>';
            // Filas
            section.content.forEach((row: any) => {
              contentHTML += '<tr>';
              Object.values(row).forEach((cell: any) => {
                contentHTML += `<td style="padding: 5px;">${cell}</td>`;
              });
              contentHTML += '</tr>';
            });
            contentHTML += '</table>';
          }
          break;
        default:
          contentHTML = '<p>[Contenido no soportado]</p>';
      }

      return `<${titleTag}>${section.title}</${titleTag}>${contentHTML}`;
    }).join('');

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          h3 { color: #7f8c8d; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          ul { margin: 10px 0; padding-left: 20px; }
          .metadata { background-color: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>${reportData.title}</h1>
        ${reportData.subtitle ? `<h2>${reportData.subtitle}</h2>` : ''}

        <div class="metadata">
          <p><strong>Fecha:</strong> ${reportData.date}</p>
          ${reportData.author ? `<p><strong>Autor:</strong> ${reportData.author}</p>` : ''}
          <p><strong>Documentos Analizados:</strong> ${reportData.metadata.totalDocuments}</p>
          <p><strong>Puntuación de Cumplimiento:</strong> ${reportData.metadata.complianceScore.toFixed(1)}%</p>
          <p><strong>Nivel de Riesgo:</strong> ${reportData.metadata.riskLevel}</p>
          <p><strong>Tiempo de Procesamiento:</strong> ${reportData.metadata.processingTime}ms</p>
        </div>

        ${sectionsHTML}

        <hr style="margin-top: 50px;">
        <p style="text-align: center; color: #7f8c8d; font-size: 12px;">
          Generado por Agente de Auditoría ISO 27001 - ${new Date().toLocaleString()}
        </p>
      </body>
      </html>
    `;
  }

  async exportToJSON(data: any, filename?: string): Promise<void> {
    try {
      console.log('📊 Exportando datos JSON...');

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `datos_auditoria_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ JSON exportado: ${a.download}`);

    } catch (error) {
      console.error('❌ Error exportando JSON:', error);
      throw new Error(`Error en exportación JSON: ${error}`);
    }
  }

  async exportToCSV(data: any[], filename?: string): Promise<void> {
    try {
      console.log('📊 Exportando datos CSV...');

      if (data.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      // Encabezados
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escapar comas y comillas
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `datos_auditoria_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ CSV exportado: ${a.download}`);

    } catch (error) {
      console.error('❌ Error exportando CSV:', error);
      throw new Error(`Error en exportación CSV: ${error}`);
    }
  }
}

// Utility functions for report generation
export class ReportGenerator {
  static generateComplianceReport(
    auditResults: any[],
    documents: any[],
    benchmarkResults?: any
  ): ReportData {
    const complianceScore = auditResults.length > 0
      ? (auditResults.filter(r => r.status === 'Cumple').length / auditResults.length) * 100
      : 0;

    const riskLevel = complianceScore >= 80 ? 'Low' :
                     complianceScore >= 60 ? 'Medium' :
                     complianceScore >= 40 ? 'High' : 'Critical';

    const sections: ReportSection[] = [
      {
        title: 'Resumen Ejecutivo',
        content: `Este reporte presenta los resultados del análisis de cumplimiento normativo realizado sobre ${documents.length} documentos corporativos. Se evaluaron ${auditResults.length} requisitos específicos de ISO 27001 y estándares relacionados.`,
        type: 'text',
        level: 1
      },
      {
        title: 'Resultados de Cumplimiento',
        content: auditResults.map(result => ({
          'Requisito': result.regulationId,
          'Estado': result.status,
          'Justificación': result.justification.substring(0, 100) + '...',
          'Documentos': result.usedDocuments?.join(', ') || 'N/A'
        })),
        type: 'table',
        level: 2
      },
      {
        title: 'Estadísticas Generales',
        content: [
          `Total de requisitos evaluados: ${auditResults.length}`,
          `Requisitos cumplidos: ${auditResults.filter(r => r.status === 'Cumple').length}`,
          `Requisitos no cumplidos: ${auditResults.filter(r => r.status === 'No Cumple').length}`,
          `Requisitos parciales: ${auditResults.filter(r => r.status === 'Parcial').length}`,
          `Puntuación general: ${complianceScore.toFixed(1)}%`,
          `Nivel de riesgo: ${riskLevel}`
        ],
        type: 'list',
        level: 2
      }
    ];

    if (benchmarkResults) {
      sections.push({
        title: 'Análisis de Rendimiento',
        content: [
          `Proveedor ganador: ${benchmarkResults.summary.bestProvider}`,
          `Tiempo promedio de respuesta: ${benchmarkResults.summary.averageResponseTime.toFixed(0)}ms`,
          `Costo total estimado: $${benchmarkResults.summary.totalCost.toFixed(4)}`,
          `Precisión general: ${(benchmarkResults.summary.overallAccuracy * 100).toFixed(1)}%`
        ],
        type: 'list',
        level: 2
      });
    }

    sections.push({
      title: 'Hallazgos Críticos',
      content: auditResults
        .filter(r => r.status === 'No Cumple')
        .map(r => `${r.regulationId}: ${r.justification.substring(0, 150)}...`),
      type: 'list',
      level: 2
    });

    return {
      title: 'Reporte de Auditoría - Cumplimiento ISO 27001',
      subtitle: 'Análisis Automatizado de Documentos Corporativos',
      date: new Date().toLocaleDateString('es-ES'),
      author: 'Agente de Auditoría ISO 27001',
      sections,
      metadata: {
        totalDocuments: documents.length,
        complianceScore,
        riskLevel: riskLevel as 'Low' | 'Medium' | 'High' | 'Critical',
        processingTime: Date.now() // Placeholder - debería calcularse realmente
      }
    };
  }

  static generateSecurityReport(
    securityResults: any,
    documents: any[]
  ): ReportData {
    const sections: ReportSection[] = [
      {
        title: 'Resumen de Seguridad',
        content: `Análisis de seguridad completado sobre ${documents.length} documentos. Se identificaron ${securityResults.vulnerabilities.length} vulnerabilidades con una puntuación general de ${securityResults.overallScore.toFixed(1)}/100.`,
        type: 'text',
        level: 1
      },
      {
        title: 'Vulnerabilidades Detectadas',
        content: securityResults.vulnerabilities.map((vuln: any) => ({
          'ID': vuln.id,
          'Severidad': vuln.severity,
          'Categoría': vuln.category,
          'Descripción': vuln.description.substring(0, 80) + '...',
          'CVSS': vuln.cvssScore || 'N/A'
        })),
        type: 'table',
        level: 2
      },
      {
        title: 'Estado de Cumplimiento',
        content: securityResults.complianceStatus.map((status: any) => ({
          'Estándar': status.standard,
          'Control': status.control,
          'Estado': status.status,
          'Última Revisión': new Date(status.lastChecked).toLocaleDateString()
        })),
        type: 'table',
        level: 2
      },
      {
        title: 'Recomendaciones de Seguridad',
        content: securityResults.recommendations,
        type: 'list',
        level: 2
      }
    ];

    return {
      title: 'Reporte de Seguridad - Análisis de Vulnerabilidades',
      subtitle: 'Evaluación de Riesgos y Cumplimiento de Seguridad',
      date: new Date().toLocaleDateString('es-ES'),
      author: 'Agente de Auditoría ISO 27001',
      sections,
      metadata: {
        totalDocuments: documents.length,
        complianceScore: securityResults.overallScore,
        riskLevel: securityResults.riskLevel,
        processingTime: Date.now()
      }
    };
  }
}