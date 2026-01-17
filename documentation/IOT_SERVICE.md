# AasraSewa - IoT Ingestion Service Implementation
This document outlines the implementation of the **High-Throughput IoT Ingestion Service** using **Node.js (NestJS)** and **MQTT**.

## 1. Codebase Structure
```text
aasra-iot-service/
├── src/
│   ├── config/              # Environment variables (MQTT_URL, DB_HOST)
│   ├── database/            # Database connection & TimescaleDB setup
│   ├── telemetry/
│   │   ├── dto/             # Data Validation (Class Validator)
│   │   ├── entities/        # TypeORM entities for Telemetry
│   │   ├── telemetry.service.ts # Business Logic (Save to DB, Check SOS)
│   │   └── telemetry.controller.ts # MQTT Topic Subscriptions
│   ├── alerts/              # Module for SOS logic
│   ├── app.module.ts
│   └── main.ts              # Entry point
├── docker-compose.yml       # Local dev stack (TimescaleDB, EMQX)
└── package.json
```

## 2. Key Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0", 
    "@nestjs/typeorm": "^10.0.0",
    "mqtt": "^5.0.0",
    "pg": "^8.0.0", 
    "typeorm": "^0.3.0",
    "class-validator": "^0.14.0"
  }
}
```

## 3. Implementation Details

### A. Entry Point (`src/main.ts`)
Configures the app to listen to MQTT messages instead of (or alongside) HTTP.

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.MQTT,
    options: {
      url: process.env.MQTT_URL || 'mqtt://localhost:1883',
      clientId: 'aasra_ingest_service_' + Math.random().toString(16).substr(2, 8),
      clean: true, // Non-persistent session for the consumer
      qos: 1,      // At least once delivery
    },
  });
  
  await app.listen();
  console.log('🚀 IoT Ingestion Service is listening via MQTT...');
}
bootstrap();
```

### B. Telemetry Controller (`src/telemetry/telemetry.controller.ts`)
Handles subscriptions to topics. Note the use of wildcards `+` in the topic pattern to capture the `band_id`.

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';
import { TelemetryService } from './telemetry.service';
import { TelemetryDto } from './dto/telemetry.dto';
import { SosDto } from './dto/sos.dto';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // Topic: bands/{band_id}/telemetry
  @MessagePattern('bands/+/telemetry')
  async handleTelemetry(@Payload() data: TelemetryDto, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    const bandId = topic.split('/')[1]; // Extract ID from topic "bands/123/telemetry"
    
    // Async processing - Fire & Forget for speed
    this.telemetryService.processTelemetry(bandId, data);
  }

  // Topic: bands/{band_id}/sos
  @MessagePattern('bands/+/sos')
  async handleSos(@Payload() data: SosDto, @Ctx() context: MqttContext) {
    const topic = context.getTopic();
    const bandId = topic.split('/')[1];
    
    console.log(`🚨 CRITICAL SOS RECEIVED from ${bandId}`);
    return this.telemetryService.processSos(bandId, data);
  }
}
```

### C. Telemetry Service (`src/telemetry/telemetry.service.ts`)
Handles logic, database persistence, and SOS routing.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryEntity } from './entities/telemetry.entity';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(TelemetryEntity)
    private repo: Repository<TelemetryEntity>,
    // Inject AlertService here
  ) {}

  async processTelemetry(bandId: string, data: any) {
    try {
      // 1. Transform DTO to Entity
      // Note: TimescaleDB handles high write throughput
      const entry = this.repo.create({
        bandId,
        timestamp: new Date(data.ts * 1000), // Unix to JS Date
        location: { type: 'Point', coordinates: [data.lon, data.lat] },
        heartRate: data.vitals.bpm,
        batteryInfo: { level: data.bat },
        rawPayload: data // Store raw JSON if needed for debugging
      });

      // 2. Save to TimescaleDB
      await this.repo.save(entry);

      // 3. (Optional) Update Redis "Last Known Location" here for Frontend Dashboard
      
    } catch (err) {
      this.logger.error(`Failed to save telemetry for ${bandId}`, err.stack);
    }
  }

  async processSos(bandId: string, data: any) {
    // 1. Persist the SOS event immediately
    // 2. Trigger External Notification Service (SMS, Push)
    // 3. ACK back to device (NestJS handles this if function returns successfully)
    this.logger.warn(`SOS Triggered by ${bandId}: ${data.msg}`);
    // await this.notificationService.sendEmergencyAlert(bandId, data);
  }
}
```

### D. TimescaleDB Entity (`src/telemetry/entities/telemetry.entity.ts`)
Using TypeORM with PostGIS geometry types.

```typescript
import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('device_telemetry')
export class TelemetryEntity {
  // TimescaleDB requires the 'time' column to be part of the primary key
  @PrimaryColumn({ type: 'timestamptz' })
  timestamp: Date;

  @PrimaryColumn({ type: 'varchar' })
  bandId: string;

  // PostGIS Geography column for efficient distance queries
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point', 
    srid: 4326 // Standard GPS coordinates
  })
  location: object;

  @Column({ type: 'int', nullable: true })
  heartRate: number;

  @Column({ type: 'jsonb', default: {} })
  batteryInfo: object;
}
```

## 4. Scalability Logic defined in this code
1.  **Transport**: Using the MQTT strategy allows this service to be horizontally scaled. If we spin up 10 instances of this service sharing a generic `queue` group (if using Kafka) or Shared Subscription in MQTT v5 (`$share/group/bands/+/telemetry`), the broker will load-balance messages across instances.
2.  **Database**: The `TelemetryEntity` uses a composite primary key `(timestamp, bandId)`, which aligns with TimescaleDB's hypertable partitioning requirements for massive scaling.
3.  **Async**: Routine telemetry is "fire and forget". Errors are logged but don't crash the stream.
