import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';
import { TelemetryService } from './telemetry.service';

@Controller()
export class TelemetryController {
    constructor(private readonly telemetryService: TelemetryService) { }

    @MessagePattern('bands/+/telemetry')
    async handleTelemetry(@Payload() data: any, @Ctx() context: MqttContext) {
        const topic = context.getTopic();
        // Topic: bands/F4A1/telemetry -> extract F4A1
        const parts = topic.split('/');
        const bandId = parts[1];

        // Validate JSON
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { }
        }

        // Support Batch/Offline Data (Array)
        if (Array.isArray(data)) {
            console.log(`Received BATCH of ${data.length} records from ${bandId}`);
            for (const record of data) {
                await this.telemetryService.processTelemetry(bandId, record);
            }
        } else {
            // Single Record
            await this.telemetryService.processTelemetry(bandId, data);
        }
    }

    @MessagePattern('bands/+/sos')
    async handleSos(@Payload() data: any, @Ctx() context: MqttContext) {
        const topic = context.getTopic();
        const bandId = topic.split('/')[1];
        // Immediate processing
        this.telemetryService.processTelemetry(bandId, { ...data, sos: true });
    }
}
