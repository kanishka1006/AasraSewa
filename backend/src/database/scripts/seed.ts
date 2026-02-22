import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { SmartBand } from '../entities/smart-band.entity';
import { Rental } from '../entities/rental.entity';
import { Telemetry } from '../entities/telemetry.entity';
import { SosAlert } from '../entities/alert.entity';
import { seedDatabase } from '../seeds/initial-seed';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT) || 5433,
    username: process.env.POSTGRES_USER || 'aasra_admin',
    password: process.env.POSTGRES_PASSWORD ?? 'password123',
    database: process.env.POSTGRES_DB || 'aasra_main',
    entities: [User, Role, SmartBand, Rental, Telemetry, SosAlert],
    synchronize: true,
});

dataSource.initialize()
    .then(async () => {
        console.log('🌱 Starting Database Seed...');
        await seedDatabase(dataSource);
        console.log('✅ Seeding Complete!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    });
