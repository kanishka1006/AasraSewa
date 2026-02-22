import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { SmartBand } from '../entities/smart-band.entity';
import { Rental } from '../entities/rental.entity';
import { Telemetry } from '../entities/telemetry.entity';
import { SosAlert } from '../entities/alert.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT) || 5433,
    username: process.env.POSTGRES_USER || 'aasra_admin',
    password: process.env.POSTGRES_PASSWORD || 'password123',
    database: process.env.POSTGRES_DB || 'aasra_main',
    entities: [User, Role, SmartBand, Rental, Telemetry, SosAlert],
    synchronize: false, // We don't want to sync, just read
});

const checkUser = async () => {
    try {
        await dataSource.initialize();
        console.log('✅ Connected to Database');

        const userRepo = dataSource.getRepository(User);
        const phoneNumber = '+917889412726';

        console.log(`🔍 Searching for user with phone: "${phoneNumber}"`);

        const user = await userRepo.createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.role', 'role')
            .where('user.phoneNumber = :phoneNumber', { phoneNumber })
            .getOne();

        if (user) {
            console.log('✅ User Found:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Name: ${user.fullName}`);
            console.log(`   Role: ${user.role?.name}`);
            console.log(`   Phone: ${user.phoneNumber}`);

            const password = 'password123';
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            console.log(`🔐 Password 'password123' match: ${isMatch ? 'YES ✅' : 'NO ❌'}`);
        } else {
            console.log('❌ User NOT Found.');

            // List all users to see what formats are there
            const allUsers = await userRepo.find();
            console.log('\n📋 Existing Users:');
            allUsers.forEach(u => console.log(`   - ${u.fullName}: "${u.phoneNumber}"`));
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await dataSource.destroy();
        process.exit(0);
    }
};

checkUser();
