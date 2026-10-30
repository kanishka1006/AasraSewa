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
            if (!data || typeof data !== 'object' ||
                !Number.isFinite(data.ts) || data.ts <= 0 ||
                !Number.isFinite(data.lat) || Math.abs(data.lat) > 90 ||
                !Number.isFinite(data.lon) || Math.abs(data.lon) > 180) {
                this.logger.warn(`Rejected invalid telemetry from ${bandId}`);
                return;
            }

            const timestamp = new Date(data.ts * 1000);
            if (!Number.isFinite(timestamp.getTime())) return;

            const entity = new this.model({
                bandId,
                timestamp,
                location: { type: 'Point', coordinates: [data.lon, data.lat] },
                heartRate: data.hr ?? data.vitals?.bpm,
                spO2: data.oxy ?? data.vitals?.spo2,
                temperature: data.tmp ?? data.vitals?.temp,
                batteryLevel: data.bat,
                isSos: data.sos === true,
                rawPayload: data
            });

            await entity.save();

            // Both services share MongoDB. Resolve the device through its active
            // rental so SOS alerts identify the correct wearer.
            const bands = this.model.db.collection('smartbands');
            const band = await bands.findOne({ macAddress: bandId });
            if (!band) return;
            const updates: Record<string, any> = { lastPingAt: timestamp };
            if (Number.isFinite(data.bat) && data.bat >= 0 && data.bat <= 100) {
                updates.batteryLevel = data.bat;
            }
            await bands.updateOne({ _id: band._id }, { $set: updates });

            if (data.sos === true) await this.handleSosTrigger(band, data);

        } catch (err) {
            this.logger.error(`Error processing telem for ${bandId}: ${err.message}`);
        }
    }

    private async handleSosTrigger(band: any, data: any) {
        const rental = await this.model.db.collection('rentals').findOne({
            band: band._id, status: 'ACTIVE'
        });
        if (!rental) {
            this.logger.warn(`SOS stored, but ${band.macAddress} has no active wearer`);
            return;
        }
        const now = new Date();
        await this.model.db.collection('sosalerts').findOneAndUpdate({
            victim: rental.user,
            status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] }
        }, {
            $setOnInsert: {
                victim: rental.user,
                status: 'OPEN',
                priority: 'HIGH',
                notes: `IoT SOS (${band.macAddress}): ${data.msg || 'Device help button pressed'}`,
                createdAt: now
            },
            $set: {
                location: { type: 'Point', coordinates: [data.lon, data.lat] },
                updatedAt: now
            }
        }, { upsert: true });
        this.logger.warn(`SOS active for ${band.macAddress} at [${data.lat}, ${data.lon}]`);
    }
}
