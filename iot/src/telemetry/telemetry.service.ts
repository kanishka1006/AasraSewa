import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { TelemetryEntity, TelemetryEntityDocument } from './telemetry.entity';

function reliefLogicPath(): string {
    const candidates = [
        path.resolve(__dirname, '../../../scripts/relief-logic.cjs'),
        path.resolve(__dirname, '../../../../scripts/relief-logic.cjs'),
        path.resolve(process.cwd(), '../scripts/relief-logic.cjs'),
        path.resolve(process.cwd(), 'scripts/relief-logic.cjs'),
    ];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error(`relief-logic.cjs not found from ${__dirname}`);
    return found;
}

function unwrapFind(result: any) {
    if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'value') && result._id === undefined) {
        return result.value;
    }
    return result ?? null;
}

function isMongoFailure(err: any) {
    return /mongo/i.test(`${err?.name || ''} ${err?.message || ''}`);
}

@Injectable()
export class TelemetryService {
    private readonly logger = new Logger(TelemetryService.name);
    private readonly relief = require(reliefLogicPath());
    private readonly outboxFile = path.join(path.dirname(reliefLogicPath()), '..', 'logs', 'outbox.jsonl');
    private replaying = false;
    private tail: Promise<void> = Promise.resolve();

    constructor(
        @InjectModel(TelemetryEntity.name) private model: Model<TelemetryEntityDocument>,
    ) { }

    async processTelemetry(bandId: string, data: any) {
        const job = this.tail.then(() => this.runPacket(bandId, data));
        this.tail = job.catch(() => undefined);
        return job;
    }

    private async runPacket(bandId: string, data: any) {
        if (!this.validPacket(data)) {
            this.logger.warn(`Rejected invalid telemetry from ${bandId}`);
            return;
        }
        if (!this.replaying) await this.replayOutbox();
        try {
            await this.handlePacket(bandId, data);
        } catch (err) {
            this.logger.error(`Error processing telem for ${bandId}: ${err.message}`);
            if (!isMongoFailure(err)) return;
            if (this.replaying) throw err;
            await this.appendOutbox(bandId, data);
        }
    }

    private validPacket(data: any) {
        if (!data || typeof data !== 'object') return false;
        if (!Number.isFinite(data.ts) || data.ts <= 0) return false;
        if (!Number.isFinite(data.lat) || Math.abs(data.lat) > 90) return false;
        if (!Number.isFinite(data.lon) || Math.abs(data.lon) > 180) return false;
        return Number.isFinite(new Date(data.ts * 1000).getTime());
    }

    private async handlePacket(bandId: string, data: any) {
        const local = this.relief.classify(data);
        const ai = await this.analyzeHealth(data);
        const aiCritical = String(ai?.risk_level || '').toUpperCase() === 'CRITICAL';
        const button = data.sos === true || data.sos === 1;
        const timestamp = new Date(data.ts * 1000);

        const entity = new this.model({
            bandId,
            timestamp,
            location: { type: 'Point', coordinates: [data.lon, data.lat] },
            heartRate: data.hr ?? data.vitals?.bpm,
            spO2: data.oxy ?? data.vitals?.spo2,
            temperature: data.tmp ?? data.vitals?.temp,
            batteryLevel: data.bat,
            isSos: button,
            rawPayload: data,
        });
        await entity.save();

        const db = this.model.db;
        const bands = db.collection('smartbands');
        const band = await bands.findOne({ macAddress: bandId });
        if (!band) return;

        const updates: Record<string, any> = { lastPingAt: timestamp };
        if (Number.isFinite(data.bat) && data.bat >= 0 && data.bat <= 100) updates.batteryLevel = data.bat;
        await bands.updateOne({ _id: band._id }, { $set: updates });

        const checkIn = await this.checkInShelter(db, bandId, data.lat, data.lon);
        if (button || local.critical || aiCritical) {
            await this.openSos(db, band, data, local, ai, checkIn, button, aiCritical);
        }
    }

    private async analyzeHealth(data: any) {
        try {
            const response = await fetch('http://127.0.0.1:8000/analyze/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(400),
            });
            if (!response.ok) return null;
            return await response.json();
        } catch {
            return null;
        }
    }

    private async checkInShelter(db: any, bandId: string, lat: number, lon: number) {
        const shelters = await db.collection('shelters').find({}).toArray();
        let nearest = null;
        for (const shelter of shelters) {
            const here = this.relief.point(shelter.lat !== undefined ? { lat: shelter.lat, lon: shelter.lon } : shelter.location || shelter);
            if (!Number.isFinite(here.lat) || !Number.isFinite(here.lon)) continue;
            const distanceMeters = this.relief.haversineMeters({ lat, lon }, here);
            if (distanceMeters <= 30 && (!nearest || distanceMeters < nearest.distanceMeters)) {
                nearest = { shelter, distanceMeters };
            }
        }
        if (!nearest) return null;
        await db.collection('shelters').updateOne(
            { _id: nearest.shelter._id },
            { $addToSet: { bands: bandId } },
        );
        const distanceMeters = Math.round(nearest.distanceMeters * 10) / 10;
        await this.appendAudit(db, {
            type: 'CHECK_IN',
            bandId,
            shelterName: nearest.shelter.name,
            distanceMeters,
            checkedIn: true,
        });
        return { name: nearest.shelter.name, distanceMeters, checkedIn: true };
    }

    private async openSos(db: any, band: any, data: any, local: any, ai: any, checkIn: any, button: boolean, aiCritical: boolean) {
        const rental = await db.collection('rentals').findOne({ band: band._id, status: 'ACTIVE' });
        if (!rental) {
            this.logger.warn(`SOS stored, but ${band.macAddress} has no active wearer`);
            return;
        }
        const triggers = [];
        if (button) triggers.push('HELP_BUTTON');
        if (local.critical) triggers.push('VITALS');
        if (aiCritical) triggers.push('AI');
        const reason = local.reasons?.length
            ? local.reasons.join('; ')
            : (ai?.reason || (button ? 'Help button pressed' : 'Critical risk'));
        const now = new Date();
        const raw = await db.collection('sosalerts').findOneAndUpdate(
            { victim: rental.user, status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } },
            {
                $setOnInsert: {
                    victim: rental.user,
                    status: 'OPEN',
                    priority: local.critical || aiCritical ? 'CRITICAL' : 'HIGH',
                    notes: `IoT SOS (${band.macAddress}): ${data.msg || reason}`,
                    createdAt: now,
                },
                $set: {
                    location: { type: 'Point', coordinates: [data.lon, data.lat] },
                    updatedAt: now,
                    trigger: triggers.join('+'),
                    reason,
                    eventCode: local.eventCode,
                    shelterName: checkIn?.name,
                    distanceMeters: checkIn?.distanceMeters,
                    checkedIn: Boolean(checkIn),
                },
            },
            { upsert: true, returnDocument: 'after' },
        );
        const alert = unwrapFind(raw);
        this.logger.warn(`SOS active for ${band.macAddress} at [${data.lat}, ${data.lon}] via ${triggers.join('+')}`);
        if (alert?._id) await this.dispatchNearest(db, alert, band.macAddress, data.lat, data.lon);
    }

    private async dispatchNearest(db: any, alert: any, bandId: string, lat: number, lon: number) {
        if (alert.rescuer && (alert.status === 'ASSIGNED' || alert.status === 'IN_PROGRESS')) return;
        const roles = await db.collection('roles').find({ name: { $in: ['RESCUER', 'VOLUNTEER'] } }).toArray();
        if (!roles.length) return;
        const people = await db.collection('users').find({
            role: { $in: roles.map((role) => role._id) },
            lastKnownLocation: { $exists: true, $ne: null },
        }).toArray();
        const busy = await db.collection('sosalerts').find({
            status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
            rescuer: { $exists: true, $ne: null },
        }).toArray();
        const busyIds = new Set(busy.map((row) => String(row.rescuer)));
        let best = null;
        for (const person of people) {
            if (busyIds.has(String(person._id))) continue;
            const location = person.lastKnownLocation;
            const here = this.relief.point(location);
            if (!Number.isFinite(here.lat) || !Number.isFinite(here.lon)) continue;
            const distanceMeters = this.relief.haversineMeters({ lat, lon }, here);
            if (!best || distanceMeters < best.distanceMeters) best = { person, distanceMeters };
        }
        if (!best) return;
        const distanceMeters = Math.round(best.distanceMeters * 10) / 10;
        const updatedRaw = await db.collection('sosalerts').findOneAndUpdate(
            { _id: alert._id },
            { $set: { rescuer: best.person._id, status: 'ASSIGNED', distanceMeters, updatedAt: new Date() } },
            { returnDocument: 'after' },
        );
        unwrapFind(updatedRaw);
        await this.appendAudit(db, {
            type: 'DISPATCH',
            bandId,
            alertId: String(alert._id),
            rescuerId: String(best.person._id),
            rescuerName: best.person.fullName,
            shelterName: alert.shelterName,
            distanceMeters,
        });
    }

    private async appendAudit(db: any, event: Record<string, unknown>) {
        const ledger = db.collection('auditledger');
        const previous = await ledger.find().sort({ _id: -1 }).limit(1).next();
        const prevHash = previous?.hash || '';
        const hash = this.relief.auditHash(prevHash, event);
        await ledger.insertOne({ ...event, prevHash, hash, event, createdAt: new Date() });
    }

    private async replayOutbox() {
        if (!fs.existsSync(this.outboxFile)) return;
        const lines = fs.readFileSync(this.outboxFile, 'utf8').split('\n').filter((line) => line.trim());
        if (!lines.length) return;
        const remaining = [...lines];
        this.replaying = true;
        try {
            for (const line of lines) {
                let row: any;
                try {
                    row = JSON.parse(line);
                } catch {
                    remaining.shift();
                    continue;
                }
                if (!this.validPacket(row?.data)) {
                    remaining.shift();
                    continue;
                }
                await this.handlePacket(row.bandId, row.data);
                remaining.shift();
            }
        } catch (err) {
            this.logger.warn(`Outbox replay paused: ${err.message}`);
        } finally {
            this.replaying = false;
            this.writeOutbox(remaining);
        }
    }

    private async appendOutbox(bandId: string, data: any) {
        fs.mkdirSync(path.dirname(this.outboxFile), { recursive: true });
        fs.appendFileSync(this.outboxFile, JSON.stringify({ bandId, data, at: new Date().toISOString() }) + '\n');
        this.logger.warn(`Queued telemetry for ${bandId} in ${this.outboxFile}`);
    }

    private writeOutbox(lines: string[]) {
        if (!lines.length) {
            if (fs.existsSync(this.outboxFile)) fs.unlinkSync(this.outboxFile);
            return;
        }
        fs.mkdirSync(path.dirname(this.outboxFile), { recursive: true });
        fs.writeFileSync(this.outboxFile, lines.join('\n') + '\n');
    }
}
