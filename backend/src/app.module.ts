import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({ uri: config.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/aasrasewa' }),
        }),
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
