import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Shelter, ShelterDocument } from './shelter.entity';
import { AuditLedger, AuditLedgerDocument } from './audit-ledger.entity';
import { FederatedState, FederatedStateDocument } from './federated-state.entity';
import { SosAlert, SosAlertDocument, AlertStatus } from '../database/entities/alert.entity';
import { LearnDto, UpsertShelterDto } from './dto/network.dto';

function reliefLogicPath(): string {
    const candidates = [
        path.resolve(__dirname, '../../../scripts/relief-logic.cjs'),
        path.resolve(__dirname, '../../../../scripts/relief-logic.cjs'),
        path.resolve(process.cwd(), 'scripts/relief-logic.cjs'),
        path.resolve(process.cwd(), '../scripts/relief-logic.cjs'),
    ];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error(`relief-logic.cjs not found from ${__dirname}`);
    return found;
}

export function unwrapFind(result: any) {
    if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'value') && result._id === undefined) {
        return result.value;
    }
    return result ?? null;
}

const CLINICAL_MODEL = {
    samples: 0,
    hrLow: 45,
    hrHigh: 140,
    spo2Low: 90,
    tempLow: 35,
    tempHigh: 39,
    fallHigh: 3,
    bpLow: 80,
    bpHigh: 180,
};

@Injectable()
export class NetworkService {
    private readonly logger = new Logger(NetworkService.name);
    private readonly relief = require(reliefLogicPath());

    constructor(
        @InjectModel(Shelter.name) private shelterModel: Model<ShelterDocument>,
        @InjectModel(AuditLedger.name) private auditModel: Model<AuditLedgerDocument>,
        @InjectModel(FederatedState.name) private stateModel: Model<FederatedStateDocument>,
        @InjectModel(SosAlert.name) private alertModel: Model<SosAlertDocument>,
    ) { }

    async overview() {
        const [shelters, audit, model, alerts] = await Promise.all([
            this.shelterModel.find().sort({ name: 1 }).lean().exec(),
            this.auditModel.find().sort({ createdAt: -1, _id: -1 }).limit(12).lean().exec(),
            this.sharedModel(),
            this.alertModel.find({
                status: { $in: [AlertStatus.OPEN, AlertStatus.ASSIGNED, AlertStatus.IN_PROGRESS] },
            })
                .populate('victim', 'fullName phoneNumber')
                .populate('rescuer', 'fullName phoneNumber')
                .sort({ updatedAt: -1 })
                .lean()
                .exec(),
        ]);
        return { shelters, audit, model, alerts };
    }

    async upsertShelter(dto: UpsertShelterDto) {
        const update: Record<string, unknown> = {
            name: dto.name,
            lat: dto.lat,
            lon: dto.lon,
            powerSource: dto.powerSource || 'SOLAR',
        };
        if (dto.bands) update.bands = dto.bands;
        if (dto.status) update.status = dto.status;
        const raw = await this.shelterModel.findOneAndUpdate(
            { name: dto.name },
            { $set: update },
            { upsert: true, new: true, returnDocument: 'after', setDefaultsOnInsert: true },
        ).exec();
        return unwrapFind(raw);
    }

    async learn(dto: LearnDto) {
        const current = await this.storedModel();
        const summary: Record<string, unknown> = {
            samples: dto.samples ?? dto.n ?? 1,
        };
        for (const key of ['hrLow', 'hrHigh', 'spo2Low', 'tempLow', 'tempHigh', 'fallHigh', 'bpLow', 'bpHigh'] as const) {
            if (typeof dto[key] === 'number') summary[key] = dto[key];
        }
        if (dto.weights) Object.assign(summary, dto.weights);
        const model = this.relief.averageWeights([current, summary]);
        await this.stateModel.findOneAndUpdate(
            { key: 'global' },
            { $set: { key: 'global', model } },
            { upsert: true, new: true },
        ).exec();
        const audit = await this.appendAudit({
            type: 'FEDERATED_ROUND',
            shelterName: dto.shelterName || '',
            samples: summary.samples,
            model,
        });
        await this.publishFederated(model);
        return { model, audit };
    }

    private async storedModel() {
        const state = await this.stateModel.findOne({ key: 'global' }).lean().exec();
        return state?.model || { samples: 0 };
    }

    private async sharedModel() {
        const stored = await this.storedModel();
        return { ...CLINICAL_MODEL, ...stored };
    }

    private async appendAudit(event: Record<string, unknown>) {
        const previous = await this.auditModel.findOne().sort({ createdAt: -1, _id: -1 }).lean().exec();
        const prevHash = previous?.hash || '';
        const hash = this.relief.auditHash(prevHash, event);
        const saved = await this.auditModel.create({ ...event, prevHash, hash, event });
        return saved.toObject();
    }

    private async publishFederated(model: Record<string, unknown>) {
        try {
            await fetch('http://127.0.0.1:8000/federated/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(model),
                signal: AbortSignal.timeout(800),
            });
        } catch (err) {
            this.logger.warn(`Federated update was not delivered: ${err?.message || err}`);
        }
    }
}
