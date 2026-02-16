
import React from 'react';
import { ExtractionResult } from '../types';
import { TRANSLATIONS } from '../constants';

interface AttendanceTableProps {
  data: ExtractionResult;
  language: 'ar' | 'en';
  darkMode: boolean;
  onUpdate: (updatedData: ExtractionResult) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ data, language, darkMode, onUpdate }) => {
  const t = TRANSLATIONS[language];

  // Get all unique dates for headers
  const allDatesSet = new Set<string>();
  data.employees.forEach(emp => {
    emp.records.forEach(rec => allDatesSet.add(rec.date));
  });
  const sortedDates = Array.from(allDatesSet).sort();

  const handleCellChange = (empIndex: number, dateIndex: number, type: 'check_in' | 'check_out' | 'name', newValue: string) => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone
    if (type === 'name') {
      newData.employees[empIndex].employee_name.value = newValue;
    } else {
      const record = newData.employees[empIndex].records.find((r: any) => r.date === sortedDates[dateIndex]);
      if (record) {
        record[type].value = newValue === '' ? null : newValue;
      }
    }
    onUpdate(newData);
  };

  const getConfidenceColor = (confidence: number, value: any) => {
    if (value === null || value === '') return ''; // Don't highlight empty cells
    if (confidence < 75) return 'bg-red-50 text-red-900 border-red-200';
    if (confidence < 90) return 'bg-yellow-50 text-yellow-900 border-yellow-200';
    return '';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className={`w-full text-sm text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} text-xs uppercase font-bold`}>
          <tr>
            <th className="px-6 py-4 sticky right-0 bg-inherit border-l shadow-sm z-10 min-w-[200px]">{t.employeeName}</th>
            {sortedDates.map((date, idx) => (
              <React.Fragment key={date}>
                <th 
                  className="px-6 py-4 border-l text-center bg-gray-50/50" 
                  colSpan={idx === 0 ? 1 : 2}
                >
                  {date}
                </th>
              </React.Fragment>
            ))}
          </tr>
          <tr className="border-t border-gray-300">
            <th className="px-6 py-2 sticky right-0 bg-inherit border-l shadow-sm z-10"></th>
            {sortedDates.map((date, idx) => (
              idx === 0 ? (
                <th key={`${date}-sub-single`} className="px-2 py-2 border-l text-center min-w-[120px]">{t.checkIn}</th>
              ) : (
                <React.Fragment key={`${date}-sub`}>
                  <th className="px-2 py-2 border-l text-center min-w-[100px]">{t.checkIn}</th>
                  <th className="px-2 py-2 border-l text-center min-w-[100px]">{t.checkOut}</th>
                </React.Fragment>
              )
            ))}
          </tr>
        </thead>
        <tbody>
          {data.employees.map((emp, empIdx) => (
            <tr key={empIdx} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-850' : 'hover:bg-gray-50'}`}>
              <td className="px-4 py-3 sticky right-0 bg-inherit border-l shadow-sm z-10">
                <input
                  type="text"
                  value={emp.employee_name.value}
                  onChange={(e) => handleCellChange(empIdx, 0, 'name', e.target.value)}
                  className={`w-full p-1 rounded border-none bg-transparent focus:ring-2 focus:ring-blue-500 font-medium ${getConfidenceColor(emp.employee_name.confidence, emp.employee_name.value)}`}
                />
              </td>
              {sortedDates.map((date, dateIdx) => {
                const record = emp.records.find(r => r.date === date);
                if (dateIdx === 0) {
                  return (
                    <td key={`${empIdx}-${date}-single`} className="px-2 py-3 border-l text-center relative">
                      <input
                        type="text"
                        value={record?.check_in.value || ''}
                        onChange={(e) => handleCellChange(empIdx, dateIdx, 'check_in', e.target.value)}
                        className={`w-full text-center p-1 rounded border-none bg-transparent focus:ring-2 focus:ring-blue-500 ${getConfidenceColor(record?.check_in.confidence || 0, record?.check_in.value)}`}
                        placeholder="--"
                      />
                      {record?.check_in.note?.value && (
                        <div className="text-[9px] text-blue-600 font-bold mt-0.5 opacity-80">{record.check_in.note.value}</div>
                      )}
                    </td>
                  );
                }
                return (
                  <React.Fragment key={`${empIdx}-${date}`}>
                    <td className="px-2 py-3 border-l text-center">
                      <input
                        type="text"
                        value={record?.check_in.value || ''}
                        onChange={(e) => handleCellChange(empIdx, dateIdx, 'check_in', e.target.value)}
                        className={`w-full text-center p-1 rounded border-none bg-transparent focus:ring-2 focus:ring-blue-500 ${getConfidenceColor(record?.check_in.confidence || 0, record?.check_in.value)}`}
                        placeholder="--"
                      />
                      {record?.check_in.note?.value && (
                        <div className="text-[9px] text-blue-600 font-bold mt-0.5 opacity-80">{record.check_in.note.value}</div>
                      )}
                    </td>
                    <td className="px-2 py-3 border-l text-center">
                      <input
                        type="text"
                        value={record?.check_out.value || ''}
                        onChange={(e) => handleCellChange(empIdx, dateIdx, 'check_out', e.target.value)}
                        className={`w-full text-center p-1 rounded border-none bg-transparent focus:ring-2 focus:ring-blue-500 ${getConfidenceColor(record?.check_out.confidence || 0, record?.check_out.value)}`}
                        placeholder="--"
                      />
                      {record?.check_out.note?.value && (
                        <div className="text-[9px] text-blue-600 font-bold mt-0.5 opacity-80">{record.check_out.note.value}</div>
                      )}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
