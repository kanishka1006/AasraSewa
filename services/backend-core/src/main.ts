import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable validation globally
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // Enable CORS for PWA
    app.enableCors();

    await app.listen(3001); // Run on 3001 to avoid Next.js conflict
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
}
bootstrap();
