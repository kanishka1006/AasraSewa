import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/role.entity';
import { NetworkService } from './network.service';
import { LearnDto, UpsertShelterDto } from './dto/network.dto';

@Controller('network')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SHELTER_MANAGER)
export class NetworkController {
    constructor(private readonly networkService: NetworkService) { }

    @Get('overview')
    overview() {
        return this.networkService.overview();
    }

    @Post('shelters')
    upsertShelter(@Body() dto: UpsertShelterDto) {
        return this.networkService.upsertShelter(dto);
    }

    @Post('learn')
    learn(@Body() dto: LearnDto) {
        return this.networkService.learn(dto);
    }
}
