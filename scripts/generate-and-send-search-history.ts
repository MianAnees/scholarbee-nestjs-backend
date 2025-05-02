import axios from 'axios';
import { faker } from '@faker-js/faker';

// Enum values from your codebase
const UserTypeEnum = ['student', 'admin', 'campus_admin'] as const;
const SearchResourceEnum = ['program', 'university', 'campus'] as const;
const LastDegreeLevelEnum = [
  'Matriculation',
  'Intermediate/FSc/FA',
  'Bachelors',
  'Masters',
  'PhD',
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
function generateFakeSearchHistory(): any {
  const degree_level = faker.helpers.arrayElement(LastDegreeLevelEnum);
  const major = faker.helpers.arrayElement(majors);
  const mode_of_study = faker.helpers.arrayElement(modesOfStudy);
  const university_name = faker.helpers.arrayElement(universityNames);
  const program_name = faker.helpers.arrayElement(programNames);

  return {
    timestamp: faker.date.recent(),
    resource_type: 'program', // For this example, always 'program'
    user_type: faker.helpers.arrayElement(UserTypeEnum),
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

  // Log the generated data
  console.log('Generated ISearchHistory objects:', JSON.stringify(fakeSearchHistories, null, 2));
  return;

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

