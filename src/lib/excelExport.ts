import * as XLSX from 'xlsx';

interface AttendanceRecord {
  student_name: string;
  uid: string;
  branch: string;
  division: string;
  batch: string;
  room: string;
  recorded_at: string;
}

export function exportToExcel(
  records: AttendanceRecord[],
  sessionName: string
): void {
  // Format data for Excel
  const excelData = records.map((record, index) => ({
    'S.No': index + 1,
    'Timestamp': new Date(record.recorded_at).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    'Student Name': record.student_name,
    'UID': record.uid,
    'Branch': record.branch,
    'Division': record.division,
    'Batch': record.batch,
    'Room': record.room,
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 20 }, // Timestamp
    { wch: 25 }, // Student Name
    { wch: 15 }, // UID
    { wch: 30 }, // Branch
    { wch: 10 }, // Division
    { wch: 10 }, // Batch
    { wch: 10 }, // Room
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${sessionName.replace(/\s+/g, '_')}_Attendance_${date}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
}
