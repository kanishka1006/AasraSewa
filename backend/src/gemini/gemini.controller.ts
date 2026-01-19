import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) { }

    @Post('analyze')
    async analyze(@Body() body: { type: string; location: string; details: string; weather?: string }) {
        const analysis = await this.geminiService.analyzeSituation(body.type, body.location, body.details, body.weather);
        return { analysis };
    }
}
