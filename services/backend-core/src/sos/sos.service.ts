import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosAlert, AlertStatus, AlertPriority } from '../database/entities/alert.entity';
import { User } from '../database/entities/user.entity';
import { CreateSosDto, UpdateSosStatusDto, AssignRescuerDto } from './dto/sos.dto';

@Injectable()
export class SosService {
    constructor(
        @InjectRepository(SosAlert)
        private alertRepo: Repository<SosAlert>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async createAlert(dto: CreateSosDto) {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('User not found');

        const alert = this.alertRepo.create({
            victim: user,
            status: AlertStatus.OPEN,
            priority: AlertPriority.HIGH,
            notes: dto.notes || 'Emergency triggered',
            // If coordinates provided, create Point. Else try using user.lastKnownLocation
            location: (dto.lat && dto.lon)
                ? { type: 'Point', coordinates: [dto.lon, dto.lat] }
                : user.lastKnownLocation
        });

        return this.alertRepo.save(alert);
    }

    async getActiveAlerts() {
        return this.alertRepo.find({
            where: [
                { status: AlertStatus.OPEN },
                { status: AlertStatus.ASSIGNED },
                { status: AlertStatus.IN_PROGRESS }
            ],
            relations: ['victim', 'rescuer'],
            order: { priority: 'ASC', createdAt: 'DESC' } // Critical first
        });
    }

    async assignRescuer(dto: AssignRescuerDto) {
        const alert = await this.alertRepo.findOne({ where: { id: dto.alertId } });
        if (!alert) throw new NotFoundException('Alert not found');

        const rescuer = await this.userRepo.findOne({ where: { id: dto.rescuerId } });
        if (!rescuer) throw new NotFoundException('Rescuer not found');

        alert.rescuer = rescuer;
        alert.status = AlertStatus.ASSIGNED;

        return this.alertRepo.save(alert);
    }

    async updateStatus(dto: UpdateSosStatusDto) {
        const alert = await this.alertRepo.findOne({ where: { id: dto.alertId } });
        if (!alert) throw new NotFoundException('Alert not found');

        alert.status = dto.status;
        if (dto.notes) {
            alert.notes = (alert.notes || '') + '\n' + dto.notes;
        }

        if (dto.status === AlertStatus.RESOLVED || dto.status === AlertStatus.FALSE_ALARM) {
            alert.resolvedAt = new Date();
        }

        return this.alertRepo.save(alert);
    }
}
