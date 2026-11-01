import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateModel19 = (transaction: any) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(transaction.date), 'dd/MM/yyyy');

  // Header
  doc.setFontSize(14);
  doc.text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', 105, 15, { align: 'center' });
  doc.text('RECEIVING ADVICE NOTE (MODEL 19)', 105, 22, { align: 'center' });
  doc.text('የንብረት ገቢ መደረጊያ ሰነድ (ሞዴል 19)', 105, 29, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Store Name: Main Asset Store`, 14, 45);
  doc.text(`Supplier: ${transaction.supplier || 'N/A'}`, 14, 52);
  doc.text(`Voucher No: ${transaction.voucherNumber || 'M19-TEMP'}`, 150, 45);
  doc.text(`Date: ${dateStr}`, 150, 52);

  // Table
  autoTable(doc, {
    startY: 60,
    head: [['Item Name', 'Model No', 'Serial No', 'Unit', 'Qty Received', 'Unit Price', 'Total Price']],
    body: [[
      transaction.item?.name || 'N/A',
      transaction.item?.modelNumber || '-',
      transaction.item?.serialNumber || '-',
      transaction.item?.unit || 'N/A',
      transaction.quantity,
      `ETB ${transaction.unitPrice?.toFixed(2) || '0.00'}`,
      `ETB ${(transaction.quantity * (transaction.unitPrice || 0)).toFixed(2)}`
    ]],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Footer for signatures
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text('Received by: ________________________', 14, finalY);
  doc.text('Checked by: ________________________', 14, finalY + 15);
  doc.text('Authorized by: ______________________', 14, finalY + 30);

  doc.save(`Model19_${transaction.voucherNumber || 'draft'}.pdf`);
};

export const generateModel20 = (transaction: any) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(transaction.date), 'dd/MM/yyyy');

  // Header
  doc.setFontSize(14);
  doc.text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', 105, 15, { align: 'center' });
  doc.text('ISSUE VOUCHER (MODEL 20)', 105, 22, { align: 'center' });
  doc.text('የንብረት ወጪ መደረጊያ ሰነድ (ሞዴል 20)', 105, 29, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Requisition No: ${transaction.requisitionNumber || 'N/A'}`, 14, 45);
  doc.text(`Property Store: Main Store`, 14, 52);
  doc.text(`Requesting Dept: ${transaction.department || 'N/A'}`, 14, 59);
  doc.text(`Voucher No: ${transaction.voucherNumber || 'M20-TEMP'}`, 150, 45);
  doc.text(`Date: ${dateStr}`, 150, 52);

  // Table
  autoTable(doc, {
    startY: 70,
    head: [['Item Name', 'Model No', 'Serial No', 'Unit', 'Qty Requested', 'Qty Issued', 'Remark']],
    body: [[
      transaction.item?.name || 'N/A',
      transaction.item?.modelNumber || '-',
      transaction.item?.serialNumber || '-',
      transaction.item?.unit || 'N/A',
      transaction.quantity,
      transaction.quantity,
      'Normal Release'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Footer for signatures
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text('Issued by: __________________________', 14, finalY);
  doc.text('Received by: ________________________', 14, finalY + 15);
  doc.text('Authorized by: ______________________', 110, finalY);

  doc.save(`Model20_${transaction.voucherNumber || 'draft'}.pdf`);
};
