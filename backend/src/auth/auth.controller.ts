import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '../database/entities/role.entity';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    // Ideally use a RefreshToken Guard strategy here for robustness
    async refresh(@Body() body: { refreshToken: string }) {
        // Implementation depends on if we verify statefully or stateless
        // For now, this is a placeholder for the concept
        return { message: "Refresh token flow not fully implemented in this MVP" };
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    getProfile(@Request() req) {
        return req.user;
    }

    @Get('admin-only')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    adminOnly(@Request() req) {
        return { message: "Welcome Admin", user: req.user };
    }

    @Get('users')
    async getAllUsers() {
        return this.authService.getAllUsers();
    }
}
