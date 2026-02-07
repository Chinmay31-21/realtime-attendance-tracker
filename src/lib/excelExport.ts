import * as XLSX from 'xlsx';

interface AttendanceRecord {
  student_name: string;
  uid: string;
  branch: string;
  division: string;
  batch: string;
  room: string;
  latitude?: number | null;
  longitude?: number | null;
  recorded_at: string;
}

// SPIT Campus coordinates
const SPIT_LOCATION = {
  lat: 19.1248,  // Sardar Patel Institute of Technology, Bhavan's Campus, Andheri West
  lng: 72.8356,
  radiusMeters: 200
};

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getLocationStatus(latitude?: number | null, longitude?: number | null): { status: string; distance: number | null } {
  if (latitude == null || longitude == null) {
    return { status: 'Location Not Available', distance: null };
  }
  
  const distance = calculateDistance(latitude, longitude, SPIT_LOCATION.lat, SPIT_LOCATION.lng);
  
  if (distance <= SPIT_LOCATION.radiusMeters) {
    return { status: 'SPIT Campus', distance: Math.round(distance) };
  } else {
    return { status: 'Outside SPIT', distance: Math.round(distance) };
  }
}

export function exportToExcel(
  records: AttendanceRecord[],
  sessionName: string
): void {
  // Format data for Excel
  const excelData = records.map((record, index) => {
    const locationInfo = getLocationStatus(record.latitude, record.longitude);
    
    return {
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
      'Attendance': 'Present',
      'Location Status': locationInfo.status,
      'Distance from SPIT (m)': locationInfo.distance ?? 'N/A',
      'Latitude': record.latitude ?? 'N/A',
      'Longitude': record.longitude ?? 'N/A',
      'Google Maps': record.latitude && record.longitude 
        ? `https://maps.google.com/?q=${record.latitude},${record.longitude}` 
        : 'N/A',
    };
  });

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
    { wch: 10 }, // Attendance
    { wch: 20 }, // Location Status
    { wch: 20 }, // Distance from SPIT
    { wch: 12 }, // Latitude
    { wch: 12 }, // Longitude
    { wch: 50 }, // Google Maps
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${sessionName.replace(/\s+/g, '_')}_Attendance_${date}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
}
