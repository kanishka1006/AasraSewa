import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { BandService } from './bands.service';
import { AssignBandDto, ReturnBandDto } from './dto/band-operations.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/role.entity';

@Controller('bands')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BandController {
    constructor(private readonly bandService: BandService) { }

    @Post('assign')
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async assignBand(@Body() dto: AssignBandDto) {
        return this.bandService.assignBand(dto);
    }

    @Post('return')
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async returnBand(@Body() dto: ReturnBandDto) {
        return this.bandService.returnBand(dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
    async getAllBands() {
        return this.bandService.getAllBands();
    }
}
