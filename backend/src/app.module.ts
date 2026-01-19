import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Telemetry } from './database/entities/telemetry.entity';
import { AuthModule } from './auth/auth.module';
import { BandModule } from './bands/bands.module';
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { SmartBand } from './database/entities/smart-band.entity';
import { Rental } from './database/entities/rental.entity';
import { LocationModule } from './location/location.module';
import { SosModule } from './sos/sos.module';
import { SosAlert } from './database/entities/alert.entity';

import { AlertsController } from './alerts/alerts.controller';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT) || 5433,
            username: process.env.POSTGRES_USER || 'aasra_admin',
            password: process.env.POSTGRES_PASSWORD || 'password123',
            database: process.env.POSTGRES_DB || 'aasra_main',
            entities: [User, Role, SmartBand, Rental, Telemetry, SosAlert],
            synchronize: true, // Only for dev!
            logging: true,
        }),
        AuthModule,
        BandModule,
        LocationModule,
        SosModule,
    ],
    controllers: [AlertsController],
})
export class AppModule { }
