import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SosAlert } from '../database/entities/alert.entity';
import { User } from '../database/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SosAlert, User])],
    controllers: [SosController],
    providers: [SosService],
})
export class SosModule { }
