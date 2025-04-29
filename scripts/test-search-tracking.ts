import axios from 'axios';
import { faker } from '@faker-js/faker';

const API_BASE_URL = 'http://localhost:3000'; // Update with your API base URL

// Generate random search parameters
const generateUniversitySearchParams = () => ({
    page: faker.number.int({ min: 1, max: 5 }),
    limit: faker.number.int({ min: 10, max: 50 }),
    sortBy: faker.helpers.arrayElement(['createdAt', 'name', 'rank']),
    order: faker.helpers.arrayElement(['asc', 'desc']),
});

const generateProgramSearchParams = () => ({
    page: faker.number.int({ min: 1, max: 5 }),
    limit: faker.number.int({ min: 10, max: 50 }),
    degree_level: faker.helpers.arrayElement(['bachelor', 'master', 'phd']),
    major: faker.helpers.arrayElement(['Computer Science', 'Business', 'Engineering', 'Medicine']),
});

async function testUniversitySearches() {
    console.log('Testing university searches...');
    
    // Test regular university search
    const universityParams = generateUniversitySearchParams();
    await axios.get(`${API_BASE_URL}/universities`, { params: universityParams });
    console.log('Regular university search completed');

    // Test university search with open programs
    const openProgramsParams = generateUniversitySearchParams();
    await axios.get(`${API_BASE_URL}/universities/open-programs`, { params: openProgramsParams });
    console.log('University search with open programs completed');
}

async function testProgramSearches() {
    console.log('Testing program searches...');
    
    // Test general program search
    const programParams = generateProgramSearchParams();
    await axios.get(`${API_BASE_URL}/programs`, { params: programParams });
    console.log('General program search completed');

    // Test program search by campus
    const campusId = faker.string.uuid();
    const campusParams = generateProgramSearchParams();
    await axios.get(`${API_BASE_URL}/programs/campus/${campusId}`, { params: campusParams });
    console.log('Program search by campus completed');

    // Test program search by university
    const universityId = faker.string.uuid();
    const universityParams = generateProgramSearchParams();
    await axios.get(`${API_BASE_URL}/programs/university/${universityId}`, { params: universityParams });
    console.log('Program search by university completed');
}

async function runTests() {
    try {
        // Run multiple iterations of each test
        const iterations = 5;
        
        for (let i = 0; i < iterations; i++) {
            console.log(`\nRunning iteration ${i + 1}/${iterations}`);
            await testUniversitySearches();
            await testProgramSearches();
            
            // Add a small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Error during testing:', error.message);
    }
}

runTests(); 