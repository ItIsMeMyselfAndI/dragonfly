import { PDFDocument, rgb } from "pdf-lib";

export async function generatePdf(data: { projectName: string; items: any[] }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { height } = page.getSize();
  const fontSize = 12;

  page.drawText(`Specs Calculation Report: ${data.projectName}`, {
    x: 50,
    y: height - 50,
    size: 20,
  });

  data.items.forEach((item, index) => {
    page.drawText(`${item.name} - Qty: ${item.qty} - Price: ₱${(item.unitPrice * item.qty).toFixed(2)}`, {
      x: 50,
      y: height - 100 - (index * 20),
      size: fontSize,
    });
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
