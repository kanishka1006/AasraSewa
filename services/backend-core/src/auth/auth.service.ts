import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role, UserRole } from '../../database/entities/role.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { phoneNumber, password, fullName } = registerDto;

        // 1. Check if user exists
        const existingUser = await this.userRepository.findOne({ where: { phoneNumber } });
        if (existingUser) {
            throw new ConflictException('Phone number already registered');
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Assign Default Role (CITIZEN)
        const citizenRole = await this.roleRepository.findOne({ where: { name: UserRole.CITIZEN } });
        if (!citizenRole) {
            throw new BadRequestException('System Roles not initialized. Run seeder.');
        }

        // 4. Create User
        const user = this.userRepository.create({
            fullName,
            phoneNumber,
            passwordHash,
            role: citizenRole,
            isSafe: true,
        });

        await this.userRepository.save(user);

        // 5. Generate Tokens
        return this.generateTokens(user);
    }

    async login(loginDto: LoginDto) {
        const { phoneNumber, password } = loginDto;

        // 1. Find User (Explicitly select passwordHash)
        const user = await this.userRepository.createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.role', 'role')
            .where('user.phoneNumber = :phoneNumber', { phoneNumber })
            .getOne();

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2. Validate Password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user);
    }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, role: user.role.name };
        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
            user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role.name,
            }
        };
    }
}
