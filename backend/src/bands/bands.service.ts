import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SmartBand, BandStatus } from '../database/entities/smart-band.entity';
import { Rental, RentalStatus, DepositStatus } from '../database/entities/rental.entity';
import { User } from '../database/entities/user.entity';
import { AssignBandDto, ReturnBandDto, ReturnCondition } from './dto/band-operations.dto';

@Injectable()
export class BandService {
    constructor(
        @InjectRepository(SmartBand)
        private bandRepo: Repository<SmartBand>,
        @InjectRepository(Rental)
        private rentalRepo: Repository<Rental>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private dataSource: DataSource,
    ) { }

    async assignBand(data: AssignBandDto) {
        const { userPhoneNumber, macAddress, depositAmount } = data;

        // Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Validate Band
            // Lock the row to prevent race conditions
            const band = await queryRunner.manager.findOne(SmartBand, {
                where: { macAddress },
                lock: { mode: 'pessimistic_write' }
            });

            if (!band) throw new NotFoundException('Smart Band not found');
            if (band.status !== BandStatus.AVAILABLE) {
                throw new ConflictException(`Band is currently ${band.status}`);
            }

            // 2. Validate User
            const user = await this.userRepo.findOne({ where: { phoneNumber: userPhoneNumber } });
            if (!user) throw new NotFoundException('User not found');

            // 3. Create Rental Record
            const rental = this.rentalRepo.create({
                user,
                band,
                depositAmount,
                depositStatus: DepositStatus.HELD,
                status: RentalStatus.ACTIVE,
                startTime: new Date(),
            });
            await queryRunner.manager.save(rental);

            // 4. Update Band Status
            band.status = BandStatus.RENTED;
            await queryRunner.manager.save(band);

            await queryRunner.commitTransaction();

            return {
                message: 'Band assigned successfully',
                rentalId: rental.id,
                bandMac: band.macAddress,
                user: user.fullName
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async returnBand(data: ReturnBandDto) {
        const { macAddress, condition } = data;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Find Band
            const band = await queryRunner.manager.findOne(SmartBand, { where: { macAddress }, lock: { mode: 'pessimistic_write' } });
            if (!band) throw new NotFoundException('Smart Band not found');

            // 2. Find Active Rental
            const rental = await queryRunner.manager.findOne(Rental, {
                where: {
                    band: { id: band.id },
                    status: RentalStatus.ACTIVE
                },
                relations: ['user']
            });

            if (!rental) throw new BadRequestException('No active rental found for this band');

            // 3. Determine New Status & Refund
            let newBandStatus = BandStatus.AVAILABLE;
            let depositStatus = DepositStatus.REFUNDED;

            if (condition === ReturnCondition.DAMAGED) {
                newBandStatus = BandStatus.MAINTENANCE;
                depositStatus = DepositStatus.FORFEITED; // Or partial, simplified for now
            } else if (condition === ReturnCondition.LOST) {
                newBandStatus = BandStatus.LOST;
                depositStatus = DepositStatus.FORFEITED;
            }

            // 4. Update Rental
            rental.endTime = new Date();
            rental.status = RentalStatus.COMPLETED;
            rental.returnCondition = condition;
            rental.depositStatus = depositStatus;
            await queryRunner.manager.save(rental);

            // 5. Update Band
            band.status = newBandStatus;
            await queryRunner.manager.save(band);

            await queryRunner.commitTransaction();

            return {
                message: 'Band returned successfully',
                refundStatus: depositStatus,
                amount: rental.depositAmount
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async getAllBands() {
        return this.bandRepo.find();
    }
}
