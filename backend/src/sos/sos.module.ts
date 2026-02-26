import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SosAlert, SosAlertSchema } from '../database/entities/alert.entity';
import { User, UserSchema } from '../database/entities/user.entity';

@Module({
    imports: [MongooseModule.forFeature([{ name: SosAlert.name, schema: SosAlertSchema }, { name: User.name, schema: UserSchema }])],
    controllers: [SosController],
    providers: [SosService],
})
export class SosModule { }
