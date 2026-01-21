import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalysisRecord {
  id: number;
  from_date: string;
  emiten: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  target_realistis?: number;
  target_max?: number;
  status: string;
  error_message?: string;
}

export const exportHistoryToPDF = (data: AnalysisRecord[], filters: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('RSY Watchlist', 14, 22);

  // Filters info
  doc.setFontSize(10);
  doc.setTextColor(100);
  let filterText = 'Filters: ';
  if (filters.emiten) filterText += `Emiten: ${filters.emiten} | `;
  if (filters.fromDate) filterText += `From: ${filters.fromDate} | `;
  if (filters.toDate) filterText += `To: ${filters.toDate} | `;
  filterText += `Status: ${filters.status}`;
  doc.text(filterText, 14, 30);

  const formatNumber = (num?: number) => num?.toLocaleString() ?? '-';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).replace(' ', '-');
  };

  const calculateGain = (price: number | undefined, target: number | undefined) => {
    if (!price || !target || price === 0) return '';
    const gain = ((target - price) / price) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;
  };

  const tableColumn = [
    'Date', 
    'Emiten', 
    'Harga', 
    'Target R1', 
    'Target Max', 
    'Bandar', 
    'Vol Bandar', 
    'Avg Bandar'
  ];

  // Darker colors for readability on white background
  const successGreen: [number, number, number] = [21, 128, 61]; // Dark green
  const warningRed: [number, number, number] = [185, 28, 28];   // Dark red
  const accentBlue: [number, number, number] = [37, 99, 235];    // Darker blue
  const darkGray: [number, number, number] = [100, 100, 100];    // Dark gray

  const tableRows = data.map(record => {
    const r1Gain = calculateGain(record.harga, record.target_realistis);
    const maxGain = calculateGain(record.harga, record.target_max);
    
    // For Avg Bandar, we show gain from avg to current price if avg < current price
    let avgGain = '';
    if (record.rata_rata_bandar && record.harga && record.rata_rata_bandar < record.harga) {
      avgGain = calculateGain(record.rata_rata_bandar, record.harga);
    }

    return [
      formatDate(record.from_date),
      record.emiten,
      formatNumber(record.harga),
      r1Gain ? `${formatNumber(record.target_realistis)}\n${r1Gain}` : formatNumber(record.target_realistis),
      maxGain ? `${formatNumber(record.target_max)}\n${maxGain}` : formatNumber(record.target_max),
      record.bandar || '-',
      formatNumber(record.barang_bandar),
      avgGain ? `${formatNumber(record.rata_rata_bandar)}\n${avgGain}` : formatNumber(record.rata_rata_bandar)
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 11, // Further increased for mobile readability
      cellPadding: { top: 4, right: 2, bottom: 4, left: 2 },
      valign: 'middle',
      minCellHeight: 16, // Increased height for larger font
    },
    headStyles: {
      fillColor: [20, 20, 31],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
    },
    columnStyles: {
      0: { cellWidth: 18 }, // Date
      1: { fontStyle: 'bold', textColor: accentBlue, cellWidth: 17 }, // Emiten
      2: { halign: 'right', cellWidth: 18 }, // Harga
      3: { halign: 'right', textColor: successGreen }, // Target R1
      4: { halign: 'right', textColor: warningRed }, // Target Max
      5: { halign: 'left', cellWidth: 18 }, // Bandar (increased to prevent wrap)
      6: { halign: 'right', fontSize: 9.5 }, // Vol Bandar
      7: { halign: 'right' }, // Avg Bandar
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    willDrawCell: (data) => {
      // For Target R1 (3), Target Max (4), and Avg Bandar (7)
      if (data.section === 'body' && [3, 4, 7].includes(data.column.index)) {
        if (Array.isArray(data.cell.text) && data.cell.text.length > 1) {
          (data.cell as any)._fullText = [...data.cell.text];
          data.cell.text = [data.cell.text[0]];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && [3, 4, 7].includes(data.column.index)) {
        const fullText = (data.cell as any)._fullText;
        if (Array.isArray(fullText) && fullText.length > 1) {
          const percentageText = fullText[1];
          
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.setFontSize(9); // Larger percentage font
          
          const padding = 2;
          const x = data.cell.x + data.cell.width - padding;
          
          // Adjusted Y to create perfect gap with larger font size
          const y = data.cell.y + (data.cell.height / 2) + 6; 
          
          doc.text(percentageText, x, y, { align: 'right' });
        }
      }
    }
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`watchlist-history-${timestamp}.pdf`);
};