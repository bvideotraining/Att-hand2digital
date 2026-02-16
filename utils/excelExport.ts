
import * as XLSX from 'xlsx';
import { ExtractionResult } from '../types';

export function exportToExcel(data: ExtractionResult, fileName: string) {
  const wb = XLSX.utils.book_new();
  
  // Get all unique dates for headers
  const allDatesSet = new Set<string>();
  data.employees.forEach(emp => {
    emp.records.forEach(rec => allDatesSet.add(rec.date));
  });
  const sortedDates = Array.from(allDatesSet).sort();
  
  const headers = ['اسم الموظف'];
  sortedDates.forEach((date, idx) => {
    if (idx === 0) {
      headers.push(`${date}`);
      headers.push(`${date} (ملاحظة)`);
    } else {
      headers.push(`${date} (حضور)`);
      headers.push(`${date} (حضور - ملاحظة)`);
      headers.push(`${date} (انصراف)`);
      headers.push(`${date} (انصراف - ملاحظة)`);
    }
  });
  
  const rows: any[] = [headers];
  
  data.employees.forEach(emp => {
    const row: any[] = [emp.employee_name.value];
    sortedDates.forEach((date, idx) => {
      const record = emp.records.find(r => r.date === date);
      if (idx === 0) {
        row.push(record?.check_in.value || '');
        row.push(record?.check_in.note?.value || '');
      } else {
        row.push(record?.check_in.value || '');
        row.push(record?.check_in.note?.value || '');
        row.push(record?.check_out.value || '');
        row.push(record?.check_out.note?.value || '');
      }
    });
    rows.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set sheet direction to RTL
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ RTL: true });
  
  // Add some basic styling (column widths)
  const wscols = [{ wch: 25 }]; // First column wider for names
  for (let i = 1; i < headers.length; i++) {
    wscols.push({ wch: 15 });
  }
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
