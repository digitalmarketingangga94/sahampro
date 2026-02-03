import * as XLSX from 'xlsx';
import type { ScreenerCalc, ScreenerColumn } from './types';

export const exportScreenerToXLSX = (
  data: ScreenerCalc[],
  columns: ScreenerColumn[],
  title: string
) => {
  const worksheetData: any[][] = [];

  // Add header row
  const header = ['Symbol'];
  columns.forEach(col => header.push(col.name));
  worksheetData.push(header);

  // Add data rows
  data.forEach(item => {
    const row: any[] = [item.company.symbol];
    columns.forEach(col => {
      const resultItem = item.results.find(res => res.id === col.id);
      // Use raw value for better data integrity in Excel, fallback to display if raw is not available
      row.push(resultItem ? (resultItem.raw || resultItem.display) : '-');
    });
    worksheetData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)); // Sheet name max 31 chars

  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};