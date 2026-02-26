import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BandController } from './bands.controller';
import { BandService } from './bands.service';
import { SmartBand, SmartBandSchema } from '../database/entities/smart-band.entity';
import { Rental, RentalSchema } from '../database/entities/rental.entity';
import { User, UserSchema } from '../database/entities/user.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: SmartBand.name, schema: SmartBandSchema }, { name: Rental.name, schema: RentalSchema }, { name: User.name, schema: UserSchema }])],
    controllers: [BandController],
    providers: [BandService],
})
export class BandModule { }
