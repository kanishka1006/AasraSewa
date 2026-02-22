import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('device_telemetry')
@Index(['bandId', 'timestamp'])
export class Telemetry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    bandId: string;

    @Column({ type: 'timestamptz' })
    timestamp: Date;

    @Column({
        type: 'jsonb',
        nullable: true
    })
    location: object;

    @Column({ type: 'float', nullable: true })
    heartRate: number;

    @Column({ type: 'float', nullable: true })
    spO2: number;

    @Column({ type: 'float', nullable: true })
    temperature: number;

    @Column({ type: 'int', nullable: true })
    batteryLevel: number;

    @Column({ default: false })
    isSos: boolean;

    @Column({ type: 'jsonb', nullable: true })
    rawPayload: any;
}
