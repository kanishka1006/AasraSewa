import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BandModule } from './bands/bands.module';
import { LocationModule } from './location/location.module';
import { SosModule } from './sos/sos.module';

import { AlertsController } from './alerts/alerts.controller';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://sanotratopraguni_db_user:kannu123@cluster0.w030zx1.mongodb.net/?appName=Cluster0'),
        LoggerModule,
        AuthModule,
        BandModule,
        LocationModule,
        SosModule,
        GeminiModule,
    ],
    controllers: [AlertsController],
})
export class AppModule { }
