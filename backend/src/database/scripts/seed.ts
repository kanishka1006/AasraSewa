import * as bcrypt from 'bcrypt';
import { Connection } from 'mongoose';
import { User, UserSchema } from '../entities/user.entity';
import { Role, RoleSchema, UserRole } from '../entities/role.entity';
import { SmartBand, SmartBandSchema, BandStatus } from '../entities/smart-band.entity';
import { Rental, RentalSchema, RentalStatus, DepositStatus } from '../entities/rental.entity';

export const seedDatabase = async (connection: Connection) => {
    const roleModel = connection.model(Role.name, RoleSchema);
    const userModel = connection.model(User.name, UserSchema);
    const bandModel = connection.model(SmartBand.name, SmartBandSchema);
    const rentalModel = connection.model(Rental.name, RentalSchema);

    // 1. Seed Roles
    const rolesData = [
        { name: UserRole.ADMIN, description: 'System Administrator', permissions: { all: true } },
        { name: UserRole.SHELTER_MANAGER, description: 'Manages Shelter Inventory', permissions: { view_all: false, manage_shelter: true } },
        { name: UserRole.CITIZEN, description: 'Regular User', permissions: { sos: true } },
    ];

    const savedRoles: Record<string, any> = {};
    for (const r of rolesData) {
        let role = await roleModel.findOne({ name: r.name });
        if (!role) {
            role = await roleModel.create(r);
        }
        savedRoles[r.name] = role;
    }

    // 2. Seed Users
    const password = 'password123';
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    let adminUser = await userModel.findOne({ phoneNumber: '+919999999999' });
    if (!adminUser) {
        adminUser = await userModel.create({
            fullName: 'System Admin',
            phoneNumber: '+919999999999',
            passwordHash: hash,
            role: savedRoles[UserRole.ADMIN]._id,
            isSafe: true,
        });
    }

    let citizenUser = await userModel.findOne({ phoneNumber: '+919876543210' });
    if (!citizenUser) {
        citizenUser = await userModel.create({
            fullName: 'Rohan Gupta',
            phoneNumber: '+919876543210',
            passwordHash: hash,
            role: savedRoles[UserRole.CITIZEN]._id,
            isSafe: true,
        });
    }

    // Seed Specific Users requested
    const newUsers = [
        { name: 'Praguni Sanotra', age: 21, phone: '+917889412726' },
        { name: 'Lomash Gupta', age: 22, phone: '+919797691071' },
        { name: 'Aakarshan Verma', age: 21, phone: '+917780883009' },
        { name: 'Pranav Sanotra', age: 24, phone: '+918825059485' },
    ];

    for (const u of newUsers) {
        let user = await userModel.findOne({ phoneNumber: u.phone });
        if (!user) {
            user = await userModel.create({
                fullName: u.name,
                phoneNumber: u.phone,
                age: u.age,
                passwordHash: hash,
                role: savedRoles[UserRole.CITIZEN]._id,
                isSafe: true,
            });
        } else {
            user.fullName = u.name;
            user.age = u.age;
            user.passwordHash = hash;
            await user.save();
        }
    }

    // 3. Seed Smart Bands
    let band1 = await bandModel.findOne({ macAddress: '00:1B:44:11:3A:B7' });
    if (!band1) {
        band1 = await bandModel.create({
            macAddress: '00:1B:44:11:3A:B7',
            firmwareVersion: 'v1.0.4',
            batteryLevel: 98,
            status: BandStatus.AVAILABLE,
        });
    }

    // 4. Seed Active Rental
    const activeRental = await rentalModel.findOne({
        user: citizenUser._id,
        status: RentalStatus.ACTIVE
    });

    if (!activeRental && band1.status === BandStatus.AVAILABLE) {
        await rentalModel.create({
            user: citizenUser._id,
            band: band1._id,
            depositAmount: 500.00,
            depositStatus: DepositStatus.HELD,
            status: RentalStatus.ACTIVE,
            startTime: new Date(),
        });

        band1.status = BandStatus.RENTED;
        await band1.save();
    }

    console.log('✅ Database Seeded Successfully');
};
