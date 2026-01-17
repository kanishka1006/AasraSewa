import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryEntity } from './telemetry.entity';

@Injectable()
export class TelemetryService {
    private readonly logger = new Logger(TelemetryService.name);

    constructor(
        @InjectRepository(TelemetryEntity)
        private repo: Repository<TelemetryEntity>,
    ) { }

    async processTelemetry(bandId: string, data: any) {
        try {
            // 1. Check SOS
            if (data.sos) {
                this.handleSosTrigger(bandId, data);
            }

            // 2. Parse Timestamp
            const timestamp = new Date(data.ts * 1000);

            // 3. Create Entity
            const entity = this.repo.create({
                bandId,
                timestamp,
                location: { type: 'Point', coordinates: [data.lon, data.lat] },
                heartRate: data.hr,
                spO2: data.oxy,
                temperature: data.tmp,
                batteryLevel: data.bat,
                isSos: !!data.sos,
                rawPayload: data
            });

            // 4. Save (Async/Fire&Forget could be used here, but await is safer)
            await this.repo.save(entity);

            // Log occasionally
            // this.logger.log(`Saved telem for ${bandId}`);

        } catch (err) {
            this.logger.error(`Error processing telem for ${bandId}: ${err.message}`);
        }
    }

    private handleSosTrigger(bandId: string, data: any) {
        this.logger.error(`🚨 SOS DETECTED from Band ${bandId} at [${data.lat}, ${data.lon}]`);
        // TODO: Trigger Notification Service / SMS Gateway
        // TODO: Update Redis "Active Incidents"
    }
}
