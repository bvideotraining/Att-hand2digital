
import * as XLSX from 'xlsx';
import { ExtractionResult } from '../types';

export function exportToExcel(data: ExtractionResult, fileName: string) {
  const wb = XLSX.utils.book_new();
  
  // Header dates as ordered in extraction (which respects AI extraction sequence)
  const headerDates = data.employees[0]?.records.map(r => r.date) || [];
  
  const headers = ['اسم الموظف'];
  headerDates.forEach((date, idx) => {
    if (idx === 0) {
      headers.push(`${date} (حضور)`);
      headers.push(`${date} (ملاحظة حضور)`);
    } else {
      headers.push(`${date} (حضور)`);
      headers.push(`${date} (ملاحظة حضور)`);
      headers.push(`${date} (انصراف)`);
      headers.push(`${date} (ملاحظة انصراف)`);
    }
  });
  
  const rows: any[] = [headers];
  
  data.employees.forEach(emp => {
    const row: any[] = [emp.employee_name.value];
    headerDates.forEach((date, idx) => {
      const record = emp.records.find(r => r.date === date);
      if (idx === 0) {
        row.push(record?.check_in?.value || '');
        row.push(record?.check_in?.note?.value || '');
      } else {
        row.push(record?.check_in?.value || '');
        row.push(record?.check_in?.note?.value || '');
        row.push(record?.check_out?.value || '');
        row.push(record?.check_out?.note?.value || '');
      }
    });
    rows.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set sheet direction to RTL
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ RTL: true });
  
  // Add some basic styling (column widths)
  const wscols = [{ wch: 30 }]; // First column wider for names
  for (let i = 1; i < headers.length; i++) {
    wscols.push({ wch: 15 });
  }
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
