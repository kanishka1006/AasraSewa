import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { SmartBand } from '../entities/smart-band.entity';
import { Rental } from '../entities/rental.entity';
import { Telemetry } from '../entities/telemetry.entity';
import { SosAlert } from '../entities/alert.entity';

const cleanup = async () => {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5433,
        username: process.env.POSTGRES_USER || 'aasra_admin',
        password: process.env.POSTGRES_PASSWORD || 'password123',
        database: process.env.POSTGRES_DB || 'aasra_main',
        entities: [User, Role, SmartBand, Rental, Telemetry, SosAlert],
        synchronize: false, // Don't sync, just connect
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log("🔥 Connected to DB for Cleanup...");

        const userRepo = dataSource.getRepository(User);

        // Delete users with the old mock phone numbers
        const oldNumbers = [
            '+919000000001',
            '+919000000002',
            '+919000000003'
        ];

        for (const phone of oldNumbers) {
            const result = await userRepo.delete({ phoneNumber: phone });
            if (result.affected && result.affected > 0) {
                console.log(`✅ Deleted duplicate/old user with phone: ${phone}`);
            } else {
                console.log(`ℹ️ No user found with phone: ${phone}`);
            }
        }

        console.log("✨ Cleanup Complete!");
        await dataSource.destroy();
    } catch (error) {
        console.error("❌ Cleanup Failed:", error);
    }
};

cleanup();
