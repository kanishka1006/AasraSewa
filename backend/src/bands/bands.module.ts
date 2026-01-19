import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BandController } from './bands.controller';
import { BandService } from './bands.service';
import { SmartBand } from '../database/entities/smart-band.entity';
import { Rental } from '../database/entities/rental.entity';
import { User } from '../database/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SmartBand, Rental, User])],
    controllers: [BandController],
    providers: [BandService],
})
export class BandModule { }
