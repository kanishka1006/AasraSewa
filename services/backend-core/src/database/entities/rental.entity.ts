import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { IsNumber, IsEnum, Min } from 'class-validator';
import { User } from './user.entity';
import { SmartBand, BandStatus } from './smart-band.entity';

export enum RentalStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    OVERDUE = 'OVERDUE',
}

export enum DepositStatus {
    HELD = 'HELD',
    REFUNDED = 'REFUNDED',
    FORFEITED = 'FORFEITED',
}

@Entity('rentals')
export class Rental {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.rentals, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => SmartBand, (band) => band.rentals, { nullable: false })
    @JoinColumn({ name: 'band_id' })
    band: SmartBand;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    @IsNumber()
    @Min(0)
    depositAmount: number;

    @Column({
        type: 'enum',
        enum: DepositStatus,
        default: DepositStatus.HELD,
    })
    depositStatus: DepositStatus;

    @CreateDateColumn()
    startTime: Date;

    @Column({ nullable: true })
    endTime: Date;

    // Calculated property or status column? Storing explicitly for querying is better.
    @Column({
        type: 'enum',
        enum: RentalStatus,
        default: RentalStatus.ACTIVE,
    })
    status: RentalStatus;

    @Column({ nullable: true })
    returnCondition: string; // 'GOOD', 'DAMAGED'
}
