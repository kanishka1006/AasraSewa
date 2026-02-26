import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { User, UserSchema } from '../database/entities/user.entity';
import { Rental, RentalSchema } from '../database/entities/rental.entity';
import { Telemetry, TelemetrySchema } from '../database/entities/telemetry.entity';
import { SmartBand, SmartBandSchema } from '../database/entities/smart-band.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Rental.name, schema: RentalSchema }, { name: Telemetry.name, schema: TelemetrySchema }, { name: SmartBand.name, schema: SmartBandSchema }])],
    controllers: [LocationController],
    providers: [LocationService],
})
export class LocationModule { }
