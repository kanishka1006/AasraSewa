import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelemetryController } from './telemetry/telemetry.controller';
import { TelemetryService } from './telemetry/telemetry.service';
import { TelemetryEntity, TelemetryEntitySchema } from './telemetry/telemetry.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({ uri: config.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/aasrasewa' }),
        }),
        MongooseModule.forFeature([{ name: TelemetryEntity.name, schema: TelemetryEntitySchema }])
    ],
    controllers: [TelemetryController],
    providers: [TelemetryService],
})
export class AppModule { }
