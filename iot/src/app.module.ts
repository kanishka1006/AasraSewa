import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelemetryController } from './telemetry/telemetry.controller';
import { TelemetryService } from './telemetry/telemetry.service';
import { TelemetryEntity, TelemetryEntitySchema } from './telemetry/telemetry.entity';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://sanotratopraguni_db_user:kannu123@cluster0.w030zx1.mongodb.net/?appName=Cluster0'),
        MongooseModule.forFeature([{ name: TelemetryEntity.name, schema: TelemetryEntitySchema }])
    ],
    controllers: [TelemetryController],
    providers: [TelemetryService],
})
export class AppModule { }
