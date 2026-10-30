import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/entities/user.entity';
import { Telemetry, TelemetryDocument } from '../database/entities/telemetry.entity';
import { SmartBand, SmartBandDocument } from '../database/entities/smart-band.entity';
import { Rental, RentalDocument, RentalStatus } from '../database/entities/rental.entity';

@Injectable()
export class LocationService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
        @InjectModel(Rental.name) private rentalModel: Model<RentalDocument>,
    ) { }

    async getLatestUserLocations() {
        const activeRentals = await this.rentalModel.find({ status: RentalStatus.ACTIVE })
            .populate('user')
            .populate('band')
            .exec();

        const results = [];

        for (const rental of activeRentals) {
            const bandMac = rental.band?.macAddress;
            if (!bandMac) continue;

            const latestTelem = await this.telemetryModel.findOne({ bandId: bandMac })
                .sort({ timestamp: -1 })
                .exec();

            if (latestTelem && latestTelem.location) {
                const loc: any = latestTelem.location;
                let lat, lon;
                if (loc.coordinates) {
                    lat = loc.coordinates[1];
                    lon = loc.coordinates[0];
                } else {
                    lat = loc.lat;
                    lon = loc.lng || loc.lon;
                }

                if (Number.isFinite(lat) && Number.isFinite(lon)) {
                    results.push({
                        userId: rental.user._id,
                        userName: rental.user.fullName,
                        bandId: bandMac,
                        lat,
                        lon,
                        ts: latestTelem.timestamp,
                        sos: latestTelem.isSos,
                        heartRate: latestTelem.heartRate,
                        spO2: latestTelem.spO2,
                        temperature: latestTelem.temperature,
                        batteryLevel: latestTelem.batteryLevel,
                        source: latestTelem.rawPayload?.source || 'device'
                    });
                }
            }
        }
        return results;
    }

    async getHistory(userId: string, hours: number = 24) {
        const rental = await this.rentalModel.findOne({ user: userId, status: RentalStatus.ACTIVE })
            .populate('band')
            .exec();

        if (!rental || !rental.band) return [];

        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - hours);

        const history = await this.telemetryModel.find({
            bandId: rental.band.macAddress,
            timestamp: { $gte: fromDate, $lte: new Date() }
        })
            .sort({ timestamp: 1 })
            .limit(500)
            .exec();

        return history.map(h => {
            const loc: any = h.location;
            let lat, lon;
            if (loc && loc.coordinates) {
                lat = loc.coordinates[1];
                lon = loc.coordinates[0];
            } else if (loc) {
                lat = loc.lat;
                lon = loc.lng || loc.lon;
            }
            return { lat, lon, ts: h.timestamp };
        }).filter(h => h.lat && h.lon);
    }

    async getHeatmap() {
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - 48);

        const raw = await this.telemetryModel.aggregate([
            { $match: { timestamp: { $gte: fromDate } } },
            { $limit: 2000 },
            {
                $project: {
                    lat: {
                        $cond: {
                            if: { $isArray: "$location.coordinates" },
                            then: { $arrayElemAt: ["$location.coordinates", 1] },
                            else: "$location.lat"
                        }
                    },
                    lon: {
                        $cond: {
                            if: { $isArray: "$location.coordinates" },
                            then: { $arrayElemAt: ["$location.coordinates", 0] },
                            else: { $ifNull: ["$location.lng", "$location.lon"] }
                        }
                    }
                }
            },
            { $match: { lat: { $ne: null }, lon: { $ne: null } } },
            {
                $group: {
                    _id: {
                        lat: { $round: ["$lat", 4] },
                        lon: { $round: ["$lon", 4] }
                    },
                    weight: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    lat: "$_id.lat",
                    lon: "$_id.lon",
                    weight: 1
                }
            }
        ]).exec();

        return raw;
    }
}
