import { faker } from '@faker-js/faker';
import axios, { AxiosError } from 'axios';

enum UserTypeEnum {
  STUDENT = 'student',
  ADMIN = 'admin',
  CAMPUS_ADMIN = 'campus_admin',
}

// Extended search resource enum to include admission programs
enum SearchResourceEnum {
  PROGRAM = 'program',
  UNIVERSITY = 'university',
  CAMPUS = 'campus',
  ADMISSION_PROGRAM = 'admission_program',
}

enum LastDegreeLevelEnum {
  Matriculation = 'Matriculation',
  IntermediateFScFA = 'Intermediate/FSc/FA',
  Bachelors = 'Bachelors',
  Masters = 'Masters',
  PhD = 'PhD',
}

// Enum values from your codebase
const UserTypeEnumValues = [
  UserTypeEnum.STUDENT,
  UserTypeEnum.ADMIN,
  UserTypeEnum.CAMPUS_ADMIN,
] as const;

const LastDegreeLevelEnumValues = [
  LastDegreeLevelEnum.Bachelors,
  LastDegreeLevelEnum.Masters,
  LastDegreeLevelEnum.PhD,
] as const;

// Example data for generation
const majors = [
  'Computer Science',
  'Business',
  'Engineering',
  'Medicine',
  'Law',
  'Psychology',
  'Economics',
];
const modesOfStudy = ['full-time', 'part-time', 'online', 'distance'];

const universityNames = [
  'Harvard University',
  'Stanford University',
  'MIT',
  'University of Oxford',
  'University of Cambridge',
  'Yale University',
  'Princeton University',
];
const programNames = [
  'Computer Science Program',
  'Business Administration Program',
  'Mechanical Engineering Program',
  'Medicine Program',
  'Law Program',
  'Psychology Program',
  'Economics Program',
];

// Program search history data structure
interface IProgramSearchHistoryData {
  university_name: string;
  program_name: string;
  degree_level: LastDegreeLevelEnum;
  major: string;
  university_id: string;
  program_id: string;
  mode_of_study: string;
}

// Program search history
interface IProgramSearchHistory {
  timestamp: Date;
  resource_type: SearchResourceEnum.PROGRAM;
  user_type: UserTypeEnum;
  user_id: string;
  data: IProgramSearchHistoryData;
}

// Admission program search history data structure
interface IAdmissionProgramSearchHistoryData {
  university_name: string;
  program_name: string;
  program_id: string;
  admission_id: string;
  min_available_seats: number;
  max_available_seats: number;
}

// Admission program search history
interface IAdmissionProgramSearchHistory {
  timestamp: Date;
  resource_type: SearchResourceEnum.ADMISSION_PROGRAM;
  user_type: UserTypeEnum;
  user_id: string;
  data: IAdmissionProgramSearchHistoryData;
}

// Generate a fake program search history
function generateProgramSearchHistory(): IProgramSearchHistory {
  const degree_level = faker.helpers.arrayElement(LastDegreeLevelEnumValues);
  const major = faker.helpers.arrayElement(majors);
  const mode_of_study = faker.helpers.arrayElement(modesOfStudy);
  const university_name = faker.helpers.arrayElement(universityNames);
  const program_name = faker.helpers.arrayElement(programNames);

  return {
    timestamp: faker.date.recent(),
    resource_type: SearchResourceEnum.PROGRAM,
    user_type: faker.helpers.arrayElement(UserTypeEnumValues),
    user_id: faker.string.uuid(),
    data: {
      university_name,
      program_name,
      degree_level,
      major,
      university_id: faker.string.uuid(),
      program_id: faker.string.uuid(),
      mode_of_study,
    },
  };
}

// Generate a fake admission program search history
function generateAdmissionProgramSearchHistory(): IAdmissionProgramSearchHistory {
  const university_name = faker.helpers.arrayElement(universityNames);
  const program_name = faker.helpers.arrayElement(programNames);

  return {
    timestamp: faker.date.recent(),
    resource_type: SearchResourceEnum.ADMISSION_PROGRAM,
    user_type: faker.helpers.arrayElement(UserTypeEnumValues),
    user_id: faker.string.uuid(),
    data: {
      university_name,
      program_name,
      program_id: faker.string.uuid(),
      admission_id: faker.string.uuid(),
      min_available_seats: faker.number.int({ min: 1, max: 50 }),
      max_available_seats: faker.number.int({ min: 51, max: 100 }),
    },
  };
}

// Send program search to API
async function sendProgramSearch(
  search: IProgramSearchHistory,
  apiBaseUrl: string,
): Promise<void> {
  const endpoint = '/programs';

  // Only use fields that match the QueryProgramDto
  const params = {
    name: search.data.program_name,
    major: search.data.major,
    mode_of_study: search.data.mode_of_study,
    university_id: search.data.university_id,
    degree_level: search.data.degree_level,
  };

  try {
    const res = await axios.get(`${apiBaseUrl}${endpoint}`, { params });
    console.log(`Sent program search:`, params, 'Response:', res.status);
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error('Error sending program search:', params, err?.message);
    } else {
      console.error('Error sending program search:', params, err);
    }
  }
}

// Send admission program search to API
async function sendAdmissionProgramSearch(
  search: IAdmissionProgramSearchHistory,
  apiBaseUrl: string,
): Promise<void> {
  const endpoint = '/admission-programs';

  // Only use fields that match the QueryAdmissionProgramDto
  const params = {
    program: search.data.program_id,
    admission: search.data.admission_id,
    minAvailableSeats: search.data.min_available_seats,
    maxAvailableSeats: search.data.max_available_seats,
  };

  try {
    const res = await axios.get(`${apiBaseUrl}${endpoint}`, { params });
    console.log(
      `Sent admission program search:`,
      params,
      'Response:',
      res.status,
    );
  } catch (err) {
    console.error(
      'Error sending admission program search:',
      params,
      err?.response?.status,
      err?.message,
    );
  }
}

async function main() {
  const API_BASE_URL = 'http://localhost:3010/api';

  // Test program searches
  console.log('=== Testing Program Searches ===');
  const programCount = 5;
  const programSearchHistories = Array.from(
    { length: programCount },
    generateProgramSearchHistory,
  );

  for (const search of programSearchHistories) {
    await sendProgramSearch(search, API_BASE_URL);
  }

  // Test admission program searches
  console.log('\n=== Testing Admission Program Searches ===');
  const admissionProgramCount = 5;
  const admissionProgramSearchHistories = Array.from(
    { length: admissionProgramCount },
    generateAdmissionProgramSearchHistory,
  );

  for (const search of admissionProgramSearchHistories) {
    await sendAdmissionProgramSearch(search, API_BASE_URL);
  }
}

main();

// Run the script
// pnpx ts-node scripts/generate-and-send-search-history.ts
