import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { SmartBand, SmartBandDocument, BandStatus } from '../database/entities/smart-band.entity';
import { Rental, RentalDocument, RentalStatus, DepositStatus } from '../database/entities/rental.entity';
import { User, UserDocument } from '../database/entities/user.entity';
import { AssignBandDto, ReturnBandDto, ReturnCondition } from './dto/band-operations.dto';

@Injectable()
export class BandService {
    constructor(
        @InjectModel(SmartBand.name) private bandModel: Model<SmartBandDocument>,
        @InjectModel(Rental.name) private rentalModel: Model<RentalDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectConnection() private connection: Connection,
    ) { }

    async assignBand(data: AssignBandDto) {
        const { userPhoneNumber, macAddress, depositAmount } = data;

        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const band = await this.bandModel.findOne({ macAddress }).session(session);

            if (!band) throw new NotFoundException('Smart Band not found');
            if (band.status !== BandStatus.AVAILABLE) {
                throw new ConflictException(`Band is currently ${band.status}`);
            }

            const user = await this.userModel.findOne({ phoneNumber: userPhoneNumber }).session(session);
            if (!user) throw new NotFoundException('User not found');

            const rental = new this.rentalModel({
                user: user._id,
                band: band._id,
                depositAmount,
                depositStatus: DepositStatus.HELD,
                status: RentalStatus.ACTIVE,
                startTime: new Date(),
            });
            await rental.save({ session });

            band.status = BandStatus.RENTED;
            await band.save({ session });

            await session.commitTransaction();

            return {
                message: 'Band assigned successfully',
                rentalId: rental._id,
                bandMac: band.macAddress,
                user: user.fullName
            };

        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async returnBand(data: ReturnBandDto) {
        const { macAddress, condition } = data;

        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const band = await this.bandModel.findOne({ macAddress }).session(session);
            if (!band) throw new NotFoundException('Smart Band not found');

            const rental = await this.rentalModel.findOne({
                band: band._id,
                status: RentalStatus.ACTIVE
            }).populate('user').session(session);

            if (!rental) throw new BadRequestException('No active rental found for this band');

            let newBandStatus = BandStatus.AVAILABLE;
            let depositStatus = DepositStatus.REFUNDED;

            if (condition === ReturnCondition.DAMAGED) {
                newBandStatus = BandStatus.MAINTENANCE;
                depositStatus = DepositStatus.FORFEITED;
            } else if (condition === ReturnCondition.LOST) {
                newBandStatus = BandStatus.LOST;
                depositStatus = DepositStatus.FORFEITED;
            }

            rental.endTime = new Date();
            rental.status = RentalStatus.COMPLETED;
            rental.returnCondition = condition;
            rental.depositStatus = depositStatus;
            await rental.save({ session });

            band.status = newBandStatus;
            await band.save({ session });

            await session.commitTransaction();

            return {
                message: 'Band returned successfully',
                refundStatus: depositStatus,
                amount: rental.depositAmount
            };

        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async getAllBands() {
        return this.bandModel.find().exec();
    }
}
