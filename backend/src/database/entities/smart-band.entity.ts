import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsMACAddress, IsEnum, Min, Max } from 'class-validator';
import { Rental } from './rental.entity';

export enum BandStatus {
    AVAILABLE = 'AVAILABLE',
    RENTED = 'RENTED',
    MAINTENANCE = 'MAINTENANCE',
    LOST = 'LOST',
}

@Entity('smart_bands')
export class SmartBand {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 17 })
    @IsMACAddress()
    macAddress: string;

    @Column({ unique: true, nullable: true })
    qrCodeHash: string;

    @Column()
    firmwareVersion: string;

    @Column({ type: 'int', default: 100 })
    @Min(0)
    @Max(100)
    batteryLevel: number;

    @Column({
        type: 'enum',
        enum: BandStatus,
        default: BandStatus.AVAILABLE,
    })
    @IsEnum(BandStatus)
    status: BandStatus;

    @Column({ nullable: true })
    lastPingAt: Date;

    @OneToMany(() => Rental, (rental) => rental.band)
    rentals: Rental[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
