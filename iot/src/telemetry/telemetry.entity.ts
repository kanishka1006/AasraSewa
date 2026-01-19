import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('device_telemetry')
@Index(['bandId', 'timestamp']) // Optimize for time-series queries
export class TelemetryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    bandId: string; // Storing the MAC/ID directly for speed

    @Column({ type: 'timestamptz' })
    timestamp: Date;

    // PostGIS Point (lon, lat)
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
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
