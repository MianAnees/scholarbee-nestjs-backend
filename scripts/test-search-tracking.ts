import axios from 'axios';
import { faker } from '@faker-js/faker';

const API_BASE_URL = 'http://localhost:3010/api'; // Update with your API base URL

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Generate random search parameters
const generateUniversitySearchParams = () => ({
    page: faker.number.int({ min: 1, max: 5 }),
    limit: faker.number.int({ min: 10, max: 50 }),
    sortBy: faker.helpers.arrayElement(['createdAt', 'name', 'ranking']),
    order: faker.helpers.arrayElement(['asc', 'desc']),
});

const generateProgramSearchParams = () => ({
    page: faker.number.int({ min: 1, max: 5 }),
    limit: faker.number.int({ min: 10, max: 50 }),
    degree_level: faker.helpers.arrayElement(['bachelor', 'master', 'phd']),
    major: faker.helpers.arrayElement(['Computer Science', 'Business', 'Engineering', 'Medicine']),
});

async function testUniversitySearches() {
    try {
        // Test regular university search
        const universityParams = generateUniversitySearchParams();
        console.log('Testing university searches...', { universityParams });

        await axiosInstance.get(`/universities`, { params: universityParams });
        console.log('Regular university search completed');

        // Test university search with open programs
        const openProgramsParams = generateUniversitySearchParams();
        await axiosInstance.get(`/universities/open-programs`, { params: openProgramsParams });
        console.log('University search with open programs completed');
    } catch (error) {
        console.error('Error during university searches:', error.message);
        throw error;
    }
}

async function testProgramSearches() {
    try {
        console.log('Testing program searches...');

        // Test general program search
        const programParams = generateProgramSearchParams();
        await axiosInstance.get(`/programs`, { params: programParams });
        console.log('General program search completed');

        // Test program search by campus
        const campusId = faker.string.uuid();
        const campusParams = generateProgramSearchParams();
        await axiosInstance.get(`/programs/campus/${campusId}`, { params: campusParams });
        console.log('Program search by campus completed');

        // Test program search by university
        const universityId = faker.string.uuid();
        const universityParams = generateProgramSearchParams();
        await axiosInstance.get(`/programs/university/${universityId}`, { params: universityParams });
        console.log('Program search by university completed');
    } catch (error) {
        console.log("🚀 ~ testProgramSearches ~ error:", error)
        console.error('Error during program searches:', error.message);
        throw error;
    }
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