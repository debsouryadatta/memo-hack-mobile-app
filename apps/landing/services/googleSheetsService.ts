import Papa from 'papaparse';

// Google Sheets public CSV export URL
const SHEET_ID = '1dUfa8yHb20UbO6sGe_cIEyIEiJT2M8UjvaTQ6oVVzqQ';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Types for raw CSV row
interface RawSheetRow {
  section: string;
  program: string;
  class: string;
  field: string;
  value: string;
}

// Types for parsed data
export interface ProgramClassData {
  chapter_notes_pdf: string;
  daily_dpp_pdf: string;
  demo_lecture_youtube: string;
  demo_lecture_title: string;
  demo_lecture_duration: string;
}

export interface TestSeriesData {
  schedule_syllabus_pdf: string;
  schedule_syllabus_title: string;
  mock_test_pdf: string;
  mock_test_title: string;
}

export interface AdmissionClassData {
  batch_days: string;
  batch_time: string;
  batch_duration: string;
  batch_start_date: string;
  fee_monthly: number;
  fee_quarterly: number;
  fee_yearly: number;
  scholarship: string;
  available_seats: number;
}

export interface SheetData {
  physics_mastery: Record<number, ProgramClassData>;
  biology_system: Record<number, ProgramClassData>;
  test_series: {
    nrts: TestSeriesData;
    jrts: TestSeriesData;
  };
  admission: {
    physics: Record<number, AdmissionClassData>;
    biology: Record<number, AdmissionClassData>;
  };
}

// Cache for the fetched data
let cachedData: SheetData | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Parse raw rows into structured data
const parseSheetData = (rows: RawSheetRow[]): SheetData => {
  const data: SheetData = {
    physics_mastery: {},
    biology_system: {},
    test_series: {
      nrts: {
        schedule_syllabus_pdf: '',
        schedule_syllabus_title: '',
        mock_test_pdf: '',
        mock_test_title: '',
      },
      jrts: {
        schedule_syllabus_pdf: '',
        schedule_syllabus_title: '',
        mock_test_pdf: '',
        mock_test_title: '',
      },
    },
    admission: {
      physics: {},
      biology: {},
    },
  };

  rows.forEach((row) => {
    // Skip comment rows (starting with #) or empty rows
    if (!row.section || row.section.startsWith('#')) return;

    const { section, program, field, value } = row;
    const classNum = parseInt(row.class, 10);

    switch (section) {
      case 'physics_mastery':
        if (!data.physics_mastery[classNum]) {
          data.physics_mastery[classNum] = {
            chapter_notes_pdf: '',
            daily_dpp_pdf: '',
            demo_lecture_youtube: '',
            demo_lecture_title: '',
            demo_lecture_duration: '',
          };
        }
        if (field in data.physics_mastery[classNum]) {
          (data.physics_mastery[classNum] as unknown as Record<string, string>)[field] = value;
        }
        break;

      case 'biology_system':
        if (!data.biology_system[classNum]) {
          data.biology_system[classNum] = {
            chapter_notes_pdf: '',
            daily_dpp_pdf: '',
            demo_lecture_youtube: '',
            demo_lecture_title: '',
            demo_lecture_duration: '',
          };
        }
        if (field in data.biology_system[classNum]) {
          (data.biology_system[classNum] as unknown as Record<string, string>)[field] = value;
        }
        break;

      case 'test_series':
        if (program === 'nrts' || program === 'jrts') {
          if (field in data.test_series[program]) {
            (data.test_series[program] as unknown as Record<string, string>)[field] = value;
          }
        }
        break;

      case 'admission':
        if (program === 'physics' || program === 'biology') {
          if (!data.admission[program][classNum]) {
            data.admission[program][classNum] = {
              batch_days: '',
              batch_time: '',
              batch_duration: '',
              batch_start_date: '',
              fee_monthly: 0,
              fee_quarterly: 0,
              fee_yearly: 0,
              scholarship: '',
              available_seats: 0,
            };
          }
          // Handle numeric fields
          if (['fee_monthly', 'fee_quarterly', 'fee_yearly', 'available_seats'].includes(field)) {
            (data.admission[program][classNum] as unknown as Record<string, number>)[field] = parseInt(value, 10) || 0;
          } else if (field in data.admission[program][classNum]) {
            (data.admission[program][classNum] as unknown as Record<string, string>)[field] = value;
          }
        }
        break;
    }
  });

  return data;
};

// Fetch and parse data from Google Sheets
export const fetchSheetData = async (): Promise<SheetData> => {
  // Return cached data if still valid
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  return new Promise((resolve, reject) => {
    Papa.parse<RawSheetRow>(SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = parseSheetData(results.data);
          cachedData = parsedData;
          lastFetchTime = now;
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        console.error('Error fetching Google Sheets data:', error);
        reject(error);
      },
    });
  });
};

// Helper functions for specific data retrieval
export const getPhysicsClassData = async (classNum: number): Promise<ProgramClassData | null> => {
  const data = await fetchSheetData();
  return data.physics_mastery[classNum] || null;
};

export const getBiologyClassData = async (classNum: number): Promise<ProgramClassData | null> => {
  const data = await fetchSheetData();
  return data.biology_system[classNum] || null;
};

export const getTestSeriesData = async (type: 'nrts' | 'jrts'): Promise<TestSeriesData> => {
  const data = await fetchSheetData();
  return data.test_series[type];
};

export const getAdmissionData = async (
  subject: 'physics' | 'biology',
  classNum: number
): Promise<AdmissionClassData | null> => {
  const data = await fetchSheetData();
  return data.admission[subject][classNum] || null;
};

// Get all admission data for a subject
export const getAllAdmissionData = async (
  subject: 'physics' | 'biology'
): Promise<Record<number, AdmissionClassData>> => {
  const data = await fetchSheetData();
  return data.admission[subject];
};

// Clear cache (useful for forcing refresh)
export const clearSheetCache = () => {
  cachedData = null;
  lastFetchTime = 0;
};
