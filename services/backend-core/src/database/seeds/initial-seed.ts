import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity'; // Logical import, path may vary
import { Role } from '../entities/role.entity';
import { SmartBand, BandStatus } from '../entities/smart-band.entity';
import { Rental, RentalStatus, DepositStatus } from '../entities/rental.entity';

export const seedDatabase = async (dataSource: DataSource) => {
    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);
    const bandRepo = dataSource.getRepository(SmartBand);
    const rentalRepo = dataSource.getRepository(Rental);

    // 1. Seed Roles
    const rolesData = [
        { name: UserRole.ADMIN, description: 'System Administrator', permissions: { all: true } },
        { name: UserRole.SHELTER_MANAGER, description: 'Manages Shelter Inventory', permissions: { view_all: false, manage_shelter: true } },
        { name: UserRole.CITIZEN, description: 'Regular User', permissions: { sos: true } },
    ];

    const savedRoles: Record<string, Role> = {};
    for (const r of rolesData) {
        let role = await roleRepo.findOneBy({ name: r.name });
        if (!role) {
            role = roleRepo.create(r);
            await roleRepo.save(role);
        }
        savedRoles[r.name] = role;
    }

    // 2. Seed Users
    const adminUser = userRepo.create({
        fullName: 'System Admin',
        phoneNumber: '+919999999999',
        passwordHash: '$2b$10$EpI...', // bcrypt hash for 'admin123'
        role: savedRoles[UserRole.ADMIN],
        isSafe: true,
    });
    await userRepo.save(adminUser);

    const citizenUser = userRepo.create({
        fullName: 'Rohan Gupta',
        phoneNumber: '+919876543210',
        passwordHash: '$2b$10$EpI...',
        role: savedRoles[UserRole.CITIZEN],
        isSafe: true,
    });
    await userRepo.save(citizenUser);

    // 3. Seed Smart Bands
    const band1 = bandRepo.create({
        macAddress: '00:1B:44:11:3A:B7',
        firmwareVersion: 'v1.0.4',
        batteryLevel: 98,
        status: BandStatus.AVAILABLE,
    });
    await bandRepo.save(band1);

    // 4. Seed Active Rental (Rohan checks out Band1)
    const rental = rentalRepo.create({
        user: citizenUser,
        band: band1,
        depositAmount: 500.00,
        depositStatus: DepositStatus.HELD,
        status: RentalStatus.ACTIVE,
        startTime: new Date(),
    });
    await rentalRepo.save(rental);

    // Update Band Status
    band1.status = BandStatus.RENTED;
    await bandRepo.save(band1);

    console.log('✅ Database Seeded Successfully');
};
