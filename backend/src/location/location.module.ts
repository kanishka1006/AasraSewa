import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { User } from '../database/entities/user.entity';
import { Rental } from '../database/entities/rental.entity';
import { Telemetry } from '../database/entities/telemetry.entity';
import { SmartBand } from '../database/entities/smart-band.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Rental, Telemetry, SmartBand])],
    controllers: [LocationController],
    providers: [LocationService],
})
export class LocationModule { }
