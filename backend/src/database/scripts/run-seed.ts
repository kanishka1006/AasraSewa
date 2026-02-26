import { connect } from 'mongoose';
import { seedDatabase } from './seed';

require('dotenv').config({ path: '../../.env' });

async function bootstrap() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://sanotratopraguni_db_user:kannu123@cluster0.w030zx1.mongodb.net/?appName=Cluster0';
    const connection = await connect(uri);
    console.log('Connected to MongoDB');
    await seedDatabase(connection.connection);
    await connection.disconnect();
    console.log('Disconnected');
}

bootstrap();
