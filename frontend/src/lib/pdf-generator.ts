import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFGeneratorOptions {
  title: string;
  subtitle: string;
  columns: string[];
  data: (string | number | boolean)[][];
  filename: string;
}

export function generateNmaSimPDF({ title, subtitle, columns, data, filename }: PDFGeneratorOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête : Fond Bleu N'ma SIM
  doc.setFillColor(31, 2, 112); // #1F0270
  doc.rect(0, 0, pageWidth, 45, "F");

  // Accent Jaune N'ma SIM
  doc.setFillColor(255, 184, 0); // #FFB800
  doc.rect(0, 43, pageWidth, 2, "F");

  // Titre en blanc (ou jaune si préféré, restons sur du blanc pour la lisibilité et jaune pour le sous-titre)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 25);

  // Sous-titre
  doc.setTextColor(255, 184, 0); // #FFB800
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 35);

  // Métadonnées (Date d'export)
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text(`Date d'export : ${new Date().toLocaleString('fr-FR')}`, 14, 55);
  doc.text(`Total : ${data.length} enregistrements`, 14, 62);

  // Tableau
  autoTable(doc, {
    startY: 70,
    head: [columns],
    body: data,
    theme: 'striped',
    headStyles: { 
      fillColor: [31, 2, 112], // Bleu N'ma SIM
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Gris très clair
    }
  });

  // Pagination (Pied de page)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    // Ligne jaune subtile au dessus du footer
    doc.setDrawColor(255, 184, 0); // #FFB800
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.getHeight() - 15, pageWidth - 14, doc.internal.pageSize.getHeight() - 15);
    doc.text(`N'ma SIM - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  // Sauvegarde
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
