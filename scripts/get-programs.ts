import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getAllPrograms() {
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
    const collection = db.collection('programs');

    console.log('📥 Retrieving all programs...');
    const programs = await collection.find({}).toArray();

    console.log(`✅ Found ${programs.length} programs in the collection`);
    console.log('\n📋 Programs:');

    programs.forEach((program, index) => {
      console.log(`\n--- Program ${index + 1} ---`);
      console.log(JSON.stringify(program, null, 2));
    });
  } catch (error) {
    console.error('❌ Error retrieving programs:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
getAllPrograms();
