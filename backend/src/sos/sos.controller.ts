import { Controller, Post, Get, Body, UseGuards, Put } from '@nestjs/common';
import { SosService } from './sos.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/role.entity';
import { CreateSosDto, AssignRescuerDto, UpdateSosStatusDto } from './dto/sos.dto';

@Controller('sos')
@UseGuards(AuthGuard('jwt'))
export class SosController {
    constructor(private readonly sosService: SosService) { }

    @Post('report')
    async reportEmergency(@Body() dto: CreateSosDto) {
        // Ideally user ID comes from JWT, but letting it be passed for IoT/Admin overrides
        return this.sosService.createAlert(dto);
    }

    @Get('active')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async getActiveAlerts() {
        return this.sosService.getActiveAlerts();
    }

    @Post('assign')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async assignRescuer(@Body() dto: AssignRescuerDto) {
        return this.sosService.assignRescuer(dto);
    }

    @Put('status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async updateStatus(@Body() dto: UpdateSosStatusDto) {
        return this.sosService.updateStatus(dto);
    }
}
