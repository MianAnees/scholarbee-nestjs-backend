import { faker } from '@faker-js/faker';
import axios from 'axios';
import { ISearchHistory, } from 'src/analytics/schemas/search-history.entity';

export enum UserTypeEnum {
  STUDENT = 'student',
  ADMIN = 'admin',
  CAMPUS_ADMIN = 'campus_admin',
}

// TODO: Should be mapped to the schema model names
export enum SearchResourceEnum {
  PROGRAM = 'program',
  UNIVERSITY = 'university',
  CAMPUS = 'campus',
}

export enum LastDegreeLevelEnum {
  Matriculation = 'Matriculation',
  IntermediateFScFA = 'Intermediate/FSc/FA',
  Bachelors = 'Bachelors',
  Masters = 'Masters',
  PhD = 'PhD',
}


// Enum values from your codebase
const UserTypeEnumValues = [UserTypeEnum.STUDENT, UserTypeEnum.ADMIN, UserTypeEnum.CAMPUS_ADMIN] as const;
const SearchResourceEnumValues = [SearchResourceEnum.PROGRAM, SearchResourceEnum.UNIVERSITY, SearchResourceEnum.CAMPUS] as const;
const LastDegreeLevelEnumValues = [
  LastDegreeLevelEnum.Bachelors,
  LastDegreeLevelEnum.Masters,
  LastDegreeLevelEnum.PhD,
] as const;

// Example majors and modes of study (customize as needed)
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

// Generate a single fake ISearchHistory object
function generateFakeSearchHistory(): ISearchHistory {
  const degree_level = faker.helpers.arrayElement(LastDegreeLevelEnumValues);
  const major = faker.helpers.arrayElement(majors);
  const mode_of_study = faker.helpers.arrayElement(modesOfStudy);
  const university_name = faker.helpers.arrayElement(universityNames);
  const program_name = faker.helpers.arrayElement(programNames);

  return {
    timestamp: faker.date.recent(),
    resource_type: faker.helpers.arrayElement(SearchResourceEnumValues),
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


async function main() {
  const API_BASE_URL = 'http://localhost:3010/api';
  const endpoint = '/programs'; // This triggers the search history indexing

  // Generate a list of fake search histories
  const count = 10;
  const fakeSearchHistories = Array.from({ length: count }, generateFakeSearchHistory);


  // Send each as a GET request to /programs with the relevant query params
  for (const search of fakeSearchHistories) {
    const { data } = search;
    // Only send fields that /programs expects as query params
    const params = {
      degree_level: data.degree_level,
      major: data.major,
      mode_of_study: data.mode_of_study,
      name: data.program_name,
      university_id: data.university_id,
    };

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`, { params });
      console.log(`Sent search:`, params, 'Response:', res.status);
    } catch (err) {
      console.error('Error sending search:', params, err?.response?.status, err?.message);
    }
  }
}

main();

// Run the script
// pnpx ts-node scripts/generate-and-send-search-history.ts

