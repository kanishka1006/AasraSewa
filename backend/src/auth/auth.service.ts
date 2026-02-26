import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/entities/user.entity';
import { Role, RoleDocument, UserRole } from '../database/entities/role.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { phoneNumber, password, fullName } = registerDto;

        const existingUser = await this.userModel.findOne({ phoneNumber }).exec();
        if (existingUser) {
            throw new ConflictException('Phone number already registered');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const citizenRole = await this.roleModel.findOne({ name: UserRole.CITIZEN }).exec();
        if (!citizenRole) {
            throw new BadRequestException('System Roles not initialized. Run seeder.');
        }

        const user = new this.userModel({
            fullName,
            phoneNumber,
            passwordHash,
            role: citizenRole._id,
            isSafe: true,
        });

        await user.save();
        await user.populate('role');

        return this.generateTokens(user as UserDocument & { role: any });
    }

    async login(loginDto: LoginDto) {
        const { phoneNumber, password } = loginDto;

        const user = await this.userModel.findOne({ phoneNumber })
            .select('+passwordHash')
            .populate('role')
            .exec();

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user as UserDocument & { role: any });
    }

    private async generateTokens(user: UserDocument & { role: any }) {
        const roleName = user.role?.name || UserRole.CITIZEN;
        const payload = { sub: user._id || user.id, role: roleName };
        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
            user: {
                id: user._id || user.id,
                fullName: user.fullName,
                role: roleName,
            }
        };
    }

    async getAllUsers() {
        return this.userModel.find().populate('role').sort({ createdAt: -1 }).exec();
    }
}
