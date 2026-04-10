
import React from 'react';
import { ExtractionResult } from '../types';
import { TRANSLATIONS } from '../constants';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface AttendanceTableProps {
  data: ExtractionResult;
  language: 'ar' | 'en';
  darkMode: boolean;
  onUpdate: (updatedData: ExtractionResult) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ data, language, darkMode, onUpdate }) => {
  const t = TRANSLATIONS[language];

  // Safely get headers from the first employee's records
  const headerDates = data?.employees?.[0]?.records?.map(r => r.date) || [];

  const handleCellChange = (empIndex: number, dateStr: string, type: 'check_in' | 'check_out' | 'name', newValue: string) => {
    if (!data?.employees) return;
    
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone
    if (type === 'name') {
      newData.employees[empIndex].employee_name.value = newValue;
    } else {
      const record = newData.employees[empIndex].records?.find((r: any) => r.date === dateStr);
      if (record) {
        record[type].value = newValue === '' ? null : newValue;
      }
    }
    onUpdate(newData);
  };

  const getConfidenceStyles = (confidence: number, value: any) => {
    if (value === null || value === '' || value === undefined) return ''; 
    if (confidence < 75) return 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
    if (confidence < 90) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return '';
  };

  if (!data?.employees || data.employees.length === 0) {
    return (
      <div className={`p-16 text-center rounded-3xl border-2 border-dashed ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
        <p className="text-gray-500 dark:text-gray-400">{t.noDataFound || 'No data found in this file.'}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border overflow-hidden shadow-xl ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm text-right border-collapse ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <thead>
            <tr className={`${darkMode ? 'bg-gray-800/80' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <th className="px-6 py-5 sticky right-0 bg-inherit border-l dark:border-gray-800 shadow-sm z-10 min-w-[220px] text-xs font-bold uppercase tracking-widest text-gray-500">
                {t.employeeName}
              </th>
              {headerDates.map((date) => (
                <th 
                  key={date}
                  className="px-6 py-5 border-l dark:border-gray-800 text-center text-xs font-bold uppercase tracking-widest text-gray-500" 
                  colSpan={2}
                >
                  {date}
                </th>
              ))}
            </tr>
            <tr className={`${darkMode ? 'bg-gray-800/40' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <th className="px-6 py-3 sticky right-0 bg-inherit border-l dark:border-gray-800 shadow-sm z-10"></th>
              {headerDates.map((date) => (
                <React.Fragment key={`${date}-sub`}>
                  <th className="px-2 py-3 border-l dark:border-gray-800 text-center min-w-[110px] text-[10px] font-extrabold text-blue-600/70 uppercase tracking-tighter">{t.checkIn}</th>
                  <th className="px-2 py-3 border-l dark:border-gray-800 text-center min-w-[110px] text-[10px] font-extrabold text-blue-600/70 uppercase tracking-tighter">{t.checkOut}</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {data.employees.map((emp, empIdx) => (
              <tr key={empIdx} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-4 sticky right-0 bg-inherit border-l dark:border-gray-800 shadow-sm z-10">
                  <div className="relative group">
                    <input
                      type="text"
                      value={emp.employee_name?.value || ''}
                      onChange={(e) => handleCellChange(empIdx, '', 'name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none bg-transparent font-bold transition-all ${getConfidenceStyles(emp.employee_name?.confidence || 0, emp.employee_name?.value)}`}
                    />
                    {(emp.employee_name?.confidence || 0) < 90 && emp.employee_name?.value && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                        {(emp.employee_name?.confidence || 0) < 75 ? <AlertCircle className="w-3 h-3 text-red-500" /> : <HelpCircle className="w-3 h-3 text-yellow-500" />}
                      </div>
                    )}
                  </div>
                </td>
                {headerDates.map((date) => {
                  const record = emp.records?.find(r => r.date === date);
                  return (
                    <React.Fragment key={`${empIdx}-${date}`}>
                      <td className="px-2 py-4 border-l dark:border-gray-800 text-center">
                        <div className="relative group">
                          <input
                            type="text"
                            value={record?.check_in?.value || ''}
                            onChange={(e) => handleCellChange(empIdx, date, 'check_in', e.target.value)}
                            className={`w-full text-center px-2 py-2 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none bg-transparent transition-all ${getConfidenceStyles(record?.check_in?.confidence || 0, record?.check_in?.value)}`}
                            placeholder="--"
                          />
                          {record?.check_in?.note?.value && (
                            <div className="text-[10px] text-blue-600 font-bold mt-1 px-1 truncate max-w-[100px] mx-auto bg-blue-50 dark:bg-blue-900/30 rounded py-0.5" title={record.check_in.note.value}>
                              {record.check_in.note.value}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-4 border-l dark:border-gray-800 text-center">
                        <div className="relative group">
                          <input
                            type="text"
                            value={record?.check_out?.value || ''}
                            onChange={(e) => handleCellChange(empIdx, date, 'check_out', e.target.value)}
                            className={`w-full text-center px-2 py-2 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none bg-transparent transition-all ${getConfidenceStyles(record?.check_out?.confidence || 0, record?.check_out?.value)}`}
                            placeholder="--"
                          />
                          {record?.check_out?.note?.value && (
                            <div className="text-[10px] text-blue-600 font-bold mt-1 px-1 truncate max-w-[100px] mx-auto bg-blue-50 dark:bg-blue-900/30 rounded py-0.5" title={record.check_out.note.value}>
                              {record.check_out.note.value}
                            </div>
                          )}
                        </div>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
