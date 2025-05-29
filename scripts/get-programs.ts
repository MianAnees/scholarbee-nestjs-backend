import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { ProgramDocument } from 'src/programs/schemas/program.schema';

// Load environment variables
dotenv.config();

async function getAllProgramDegreeLevels() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();

    const db = client.db();
    const collection = db.collection<ProgramDocument>('programs');

    console.log('📥 Retrieving all degree levels...');
    const degreeLevels = await collection.distinct('degree_level');

    console.log(
      `✅ Found ${degreeLevels.length} degree levels in the collection`,
    );
    console.log('\n📋 Count of Degree Levels:', degreeLevels.length);
    console.log('\n📋 Degree Levels:', degreeLevels);
  } catch (error) {
    console.error('❌ Error retrieving degree levels:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
getAllProgramDegreeLevels();
