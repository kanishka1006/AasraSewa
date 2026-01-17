import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TelemetryController } from './telemetry/telemetry.controller';
import { TelemetryService } from './telemetry/telemetry.service';
import { TelemetryEntity } from './telemetry/telemetry.entity';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST || '127.0.0.1',
            port: 5433,
            username: process.env.POSTGRES_USER || 'aasra_admin',
            password: process.env.POSTGRES_PASSWORD || 'password123',
            database: process.env.POSTGRES_DB || 'aasra_main',
            entities: [TelemetryEntity],
            synchronize: true, // Only for dev!
        }),
        TypeOrmModule.forFeature([TelemetryEntity]),
    ],
    controllers: [TelemetryController],
    providers: [TelemetryService],
})
export class AppModule { }
