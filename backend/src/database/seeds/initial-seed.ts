import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role, UserRole } from '../entities/role.entity';
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

    // 2. Seed Users
    const password = 'password123';
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    let adminUser = await userRepo.findOneBy({ phoneNumber: '+919999999999' });
    if (!adminUser) {
        adminUser = userRepo.create({
            fullName: 'System Admin',
            phoneNumber: '+919999999999',
            passwordHash: hash,
            role: savedRoles[UserRole.ADMIN],
            isSafe: true,
        });
        await userRepo.save(adminUser);
    }

    let citizenUser = await userRepo.findOneBy({ phoneNumber: '+919876543210' });
    if (!citizenUser) {
        citizenUser = userRepo.create({
            fullName: 'Rohan Gupta',
            phoneNumber: '+919876543210',
            passwordHash: hash,
            role: savedRoles[UserRole.CITIZEN],
            isSafe: true,
        });
        await userRepo.save(citizenUser);
    }

    // Seed Specific Users requested
    const newUsers = [
        { name: 'Praguni Sanotra', age: 21, phone: '+917889412726' },
        { name: 'Lomash Gupta', age: 22, phone: '+919797691071' },
        { name: 'Aakarshan Verma', age: 21, phone: '+917780883009' },
        { name: 'Pranav Sanotra', age: 24, phone: '+918825059485' },
    ];

    for (const u of newUsers) {
        let user = await userRepo.findOneBy({ phoneNumber: u.phone });
        if (!user) {
            user = userRepo.create({
                fullName: u.name,
                phoneNumber: u.phone,
                age: u.age,
                passwordHash: hash,
                role: savedRoles[UserRole.CITIZEN],
                isSafe: true,
            });
            await userRepo.save(user);
        }
    }

    // 3. Seed Smart Bands
    let band1 = await bandRepo.findOneBy({ macAddress: '00:1B:44:11:3A:B7' });
    if (!band1) {
        band1 = bandRepo.create({
            macAddress: '00:1B:44:11:3A:B7',
            firmwareVersion: 'v1.0.4',
            batteryLevel: 98,
            status: BandStatus.AVAILABLE,
        });
        await bandRepo.save(band1);
    }

    // 4. Seed Active Rental (Rohan checks out Band1)
    // Only create rental if we just created the band or if it's available, otherwise skip to avoid complexity in seed
    const activeRental = await rentalRepo.findOne({
        where: {
            user: { id: citizenUser.id },
            status: RentalStatus.ACTIVE
        }
    });

    if (!activeRental && band1.status === BandStatus.AVAILABLE) {
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
    }

    console.log('✅ Database Seeded Successfully');
};
