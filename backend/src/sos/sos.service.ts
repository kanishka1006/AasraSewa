import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SosAlert, SosAlertDocument, AlertStatus, AlertPriority } from '../database/entities/alert.entity';
import { User, UserDocument } from '../database/entities/user.entity';
import { CreateSosDto, UpdateSosStatusDto, AssignRescuerDto } from './dto/sos.dto';
import { Subject } from 'rxjs';

@Injectable()
export class SosService {
    public readonly alertSubject = new Subject<SosAlertDocument>();

    constructor(
        @InjectModel(SosAlert.name) private alertModel: Model<SosAlertDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async createAlert(dto: CreateSosDto) {
        const user = await this.userModel.findById(dto.userId);
        if (!user) throw new NotFoundException('User not found');

        const alert = new this.alertModel({
            victim: user._id,
            status: AlertStatus.OPEN,
            priority: AlertPriority.HIGH,
            notes: dto.notes || 'Emergency triggered',
            location: (dto.lat && dto.lon)
                ? { type: 'Point', coordinates: [dto.lon, dto.lat] }
                : user.lastKnownLocation
        });

        const savedAlert = await alert.save();
        this.alertSubject.next(savedAlert);
        return savedAlert;
    }

    async getActiveAlerts() {
        return this.alertModel.find({
            status: { $in: [AlertStatus.OPEN, AlertStatus.ASSIGNED, AlertStatus.IN_PROGRESS] }
        })
            .populate('victim')
            .populate('rescuer')
            .sort({ priority: 1, createdAt: -1 }) // Critical first
            .exec();
    }

    async assignRescuer(dto: AssignRescuerDto) {
        const alert = await this.alertModel.findById(dto.alertId);
        if (!alert) throw new NotFoundException('Alert not found');

        const rescuer = await this.userModel.findById(dto.rescuerId);
        if (!rescuer) throw new NotFoundException('Rescuer not found');

        alert.rescuer = rescuer._id;
        alert.status = AlertStatus.ASSIGNED;

        return alert.save();
    }

    async updateStatus(dto: UpdateSosStatusDto) {
        const alert = await this.alertModel.findById(dto.alertId);
        if (!alert) throw new NotFoundException('Alert not found');

        alert.status = dto.status as AlertStatus;
        if (dto.notes) {
            alert.notes = (alert.notes || '') + '\n' + dto.notes;
        }

        if (dto.status === AlertStatus.RESOLVED || dto.status === AlertStatus.FALSE_ALARM) {
            alert.resolvedAt = new Date();
        }

        return alert.save();
    }
}
