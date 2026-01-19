import { Controller, Get, Post, Body } from '@nestjs/common';

// Simple in-memory store for demo purposes
// Using 'var' or 'let' at module level ensures persistence across requests
let ALERTS_CACHE: any[] = [];

@Controller('alerts')
export class AlertsController {

    @Get()
    getAll() {
        return ALERTS_CACHE;
    }

    @Post()
    create(@Body() alert: any) {
        console.log("New Alert Received:", alert);
        // Prepend new alert
        ALERTS_CACHE = [alert, ...ALERTS_CACHE];
        // Keep only last 20 to avoid overflow
        if (ALERTS_CACHE.length > 20) {
            ALERTS_CACHE = ALERTS_CACHE.slice(0, 20);
        }
        return { success: true };
    }
}
