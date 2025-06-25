import { faker } from '@faker-js/faker';
import { DegreeLevelEnum } from 'src/common/constants/shared.constants';

export interface MockProgram {
  id: string;
  name: string;
  major?: string;
  degree_level: DegreeLevelEnum;
  university: string;
  city: string;
  deadline: string; // ISO date string
  trend_score: number; // 0-100
  mode_of_study?: string;
  scholarship_options?: string;
  accreditations?: string;
  academic_departments?: string;
}

// Common cities for realistic data
const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
  'Austin',
  'Jacksonville',
  'Fort Worth',
  'Columbus',
  'Charlotte',
  'San Francisco',
  'Indianapolis',
  'Seattle',
  'Denver',
  'Washington',
  'Boston',
  'El Paso',
  'Nashville',
  'Detroit',
  'Oklahoma City',
  'Portland',
  'Las Vegas',
  'Memphis',
  'Louisville',
  'Baltimore',
  'Milwaukee',
  'Albuquerque',
  'Tucson',
  'Fresno',
  'Sacramento',
];

// Common universities
const UNIVERSITIES = [
  'Harvard University',
  'Stanford University',
  'MIT',
  'Yale University',
  'Princeton University',
  'Columbia University',
  'University of Chicago',
  'University of Pennsylvania',
  'Duke University',
  'Northwestern University',
  'Johns Hopkins University',
  'California Institute of Technology',
  'Dartmouth College',
  'Brown University',
  'Cornell University',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'University of Michigan',
  'University of Virginia',
  'Georgetown University',
  'New York University',
  'University of Southern California',
  'Carnegie Mellon University',
  'University of Texas at Austin',
  'University of Wisconsin-Madison',
  'University of Illinois at Urbana-Champaign',
  'University of Washington',
  'University of North Carolina at Chapel Hill',
  'University of California, San Diego',
  'Boston University',
  'University of California, Davis',
  'University of Minnesota',
  'University of Maryland',
  'University of Pittsburgh',
  'Purdue University',
  'University of Florida',
  'University of Georgia',
  'University of Iowa',
  'University of Colorado Boulder',
  'University of Arizona',
  'University of Oregon',
];

// Common majors/fields of study
const MAJORS = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Medicine',
  'Law',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Economics',
  'Political Science',
  'History',
  'English Literature',
  'Art History',
  'Architecture',
  'Environmental Science',
  'Public Health',
  'Nursing',
  'Education',
  'Social Work',
  'Journalism',
  'Communications',
  'Marketing',
  'Finance',
  'Accounting',
  'International Relations',
  'Philosophy',
  'Sociology',
  'Anthropology',
  'Linguistics',
  'Music',
  'Theater',
  'Film Studies',
  'Digital Media',
  'Data Science',
  'Cybersecurity',
];

// Degree levels
const DEGREE_LEVELS = Object.values(DegreeLevelEnum);

// Modes of study
const MODES_OF_STUDY = ['Full-time', 'Part-time', 'Online', 'Hybrid'];

// Scholarship options
const SCHOLARSHIP_OPTIONS = [
  'Merit-based',
  'Need-based',
  'Athletic',
  'Academic Excellence',
  'International Student',
  'Graduate Research',
  'Teaching Assistant',
  'Research Assistant',
  'Departmental',
  'External Funding',
];

// Generate a single mock program
function generateMockProgram(): MockProgram {
  const city = faker.helpers.arrayElement(CITIES);
  const university = faker.helpers.arrayElement(UNIVERSITIES);
  const major = faker.helpers.arrayElement(MAJORS);
  const degreeLevel = faker.helpers.arrayElement(DEGREE_LEVELS);

  // Generate deadline between now and 6 months from now
  const deadline = faker.date.between({
    from: new Date(),
    to: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
  });

  // Generate trend score (0-100)
  const trendScore = faker.number.int({ min: 0, max: 100 });

  return {
    id: faker.string.uuid(),
    name: `${major} ${degreeLevel}`,
    major,
    degree_level: degreeLevel,
    university,
    city,
    deadline: deadline.toISOString(),
    trend_score: trendScore,
    mode_of_study: faker.helpers.arrayElement(MODES_OF_STUDY),
    scholarship_options: faker.helpers.arrayElement(SCHOLARSHIP_OPTIONS),
    accreditations: faker.helpers.maybe(
      () => faker.helpers.arrayElement(['AACSB', 'ABET', 'AMBA', 'EQUIS']),
      { probability: 0.7 },
    ),
    academic_departments: faker.helpers.maybe(
      () =>
        faker.helpers.arrayElement([
          'Computer Science',
          'Engineering',
          'Business',
          'Arts & Sciences',
        ]),
      { probability: 0.8 },
    ),
  };
}

// Generate 80 mock programs
export const MOCK_PROGRAMS: MockProgram[] = Array.from({ length: 80 }, () =>
  generateMockProgram(),
);
