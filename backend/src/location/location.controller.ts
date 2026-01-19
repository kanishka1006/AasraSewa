import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/role.entity';

@Controller('location')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @Get('latest')
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async getLatestLocations() {
        return this.locationService.getLatestUserLocations();
    }

    @Get('history/:userId')
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async getUserHistory(
        @Param('userId') userId: string,
        @Query('hours') hours: number
    ) {
        return this.locationService.getHistory(userId, hours || 24);
    }

    @Get('heatmap')
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async getHeatmap() {
        return this.locationService.getHeatmap();
    }
}
