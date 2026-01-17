import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Telemetry } from '../database/entities/telemetry.entity';
import { SmartBand } from '../database/entities/smart-band.entity';
import { Rental, RentalStatus } from '../database/entities/rental.entity';

@Injectable()
export class LocationService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Telemetry)
        private telemetryRepo: Repository<Telemetry>,
        @InjectRepository(Rental)
        private rentalRepo: Repository<Rental>,
    ) { }

    async getLatestUserLocations() {
        // 1. Get active rentals to link Users <-> Bands
        const activeRentals = await this.rentalRepo.find({
            where: { status: RentalStatus.ACTIVE },
            relations: ['user', 'band'],
        });

        // 2. Ideally, we should fetch the latest telemetry for these bands
        // For MVP, if User entity has lastKnownLocation updated, use that.
        // If not, let's query the telemetry table for the latest point per band.

        const results = [];

        for (const rental of activeRentals) {
            const latestTelem = await this.telemetryRepo.findOne({
                where: { bandId: rental.band.macAddress }, // assuming bandId matches macAddress in ingestion
                order: { timestamp: 'DESC' }
            });

            if (latestTelem && latestTelem.location) {
                const loc: any = latestTelem.location;
                results.push({
                    userId: rental.user.id,
                    userName: rental.user.fullName,
                    bandId: rental.band.macAddress,
                    lat: loc.coordinates[1],
                    lon: loc.coordinates[0],
                    ts: latestTelem.timestamp,
                    sos: latestTelem.isSos
                });
            }
        }
        return results;
    }

    async getHistory(userId: string, hours: number = 24) {
        // 1. Find active band for user
        const rental = await this.rentalRepo.findOne({
            where: { user: { id: userId }, status: RentalStatus.ACTIVE },
            relations: ['band']
        });

        if (!rental) return [];

        // 2. Query History
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - hours);

        const history = await this.telemetryRepo.find({
            where: {
                bandId: rental.band.macAddress,
                timestamp: Between(fromDate, new Date())
            },
            order: { timestamp: 'ASC' },
            take: 500 // Limit points
        });

        return history.map(h => {
            const loc: any = h.location;
            return {
                lat: loc.coordinates[1],
                lon: loc.coordinates[0],
                ts: h.timestamp
            };
        });
    }

    async getHeatmap() {
        // Use raw query for PostGIS clustering/aggregation
        // Simple grid aggregation: Round lat/lon to 4 decimal places and count
        const query = `
        SELECT 
            ST_X(location::geometry) as lon, 
            ST_Y(location::geometry) as lat,
            COUNT(*) as distinct_count
        FROM device_telemetry
        WHERE timestamp > NOW() - INTERVAL '48 hours'
        GROUP BY location
        LIMIT 2000;
      `;
        // Note: In real production, use ST_SnapToGrid or HexGrid
        const raw = await this.telemetryRepo.query(query);
        return raw.map(r => ({ lat: r.lat, lon: r.lon, weight: r.distinct_count }));
    }
}
