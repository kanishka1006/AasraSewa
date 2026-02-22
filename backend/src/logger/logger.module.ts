import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiRequest, ApiRequestSchema } from './api-request.schema';
import { ApiRequestInterceptor } from './api-request.interceptor';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiRequestSchema }]),
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ApiRequestInterceptor,
        },
    ],
})
export class LoggerModule { }
