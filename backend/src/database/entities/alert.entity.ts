import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AlertStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    FALSE_ALARM = 'FALSE_ALARM',
}

export enum AlertPriority {
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

@Entity('sos_alerts')
export class SosAlert {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // The Victim
    @ManyToOne(() => User, (user) => user.alerts)
    @JoinColumn({ name: 'victimId' })
    victim: User;

    @Column({ nullable: true })
    victimId: string;

    // The Rescuer
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'rescuerId' })
    rescuer: User;

    @Column({ nullable: true })
    rescuerId: string;

    @Column({
        type: 'enum',
        enum: AlertStatus,
        default: AlertStatus.OPEN,
    })
    status: AlertStatus;

    @Column({
        type: 'enum',
        enum: AlertPriority,
        default: AlertPriority.HIGH,
    })
    priority: AlertPriority;

    // Snapshot location where SOS was triggered
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: object;

    @Column({ type: 'text', nullable: true })
    notes: string; // Resolution notes or logs

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    resolvedAt: Date;
}
