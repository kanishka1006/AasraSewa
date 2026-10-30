import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.MQTT,
        options: {
            url: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            clientId: 'iot_ingestion_' + Math.random().toString(16).substr(2, 8),
            clean: true,
        },
    });

    await app.listen();
    console.log('🚀 IoT Ingestion Service is listening via MQTT...');
    if (process.send) process.send({ type: 'ready' });
}
bootstrap();
