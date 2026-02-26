import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelemetryEntity, TelemetryEntityDocument } from './telemetry.entity';

@Injectable()
export class TelemetryService {
    private readonly logger = new Logger(TelemetryService.name);

    constructor(
        @InjectModel(TelemetryEntity.name) private model: Model<TelemetryEntityDocument>,
    ) { }

    async processTelemetry(bandId: string, data: any) {
        try {
            if (data.sos) {
                this.handleSosTrigger(bandId, data);
            }

            const timestamp = new Date(data.ts * 1000);

            const entity = new this.model({
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

            await entity.save();

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
