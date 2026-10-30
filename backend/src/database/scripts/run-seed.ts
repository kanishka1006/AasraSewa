import { connect } from 'mongoose';
import { seedDatabase } from './seed';

require('dotenv').config();

async function bootstrap() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aasrasewa';
    const connection = await connect(uri);
    console.log('Connected to MongoDB');
    try {
        await seedDatabase(connection.connection);
    } finally {
        await connection.disconnect();
    }
    console.log('Disconnected');
}

bootstrap().catch(error => { console.error(error.message); process.exitCode = 1; });
