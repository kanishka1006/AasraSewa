import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'fallback_secret', // Use env var in prod
        });
    }

    async validate(payload: any) {
        // Payload contains { sub: userId, role: roleName }
        const user = await this.userModel.findById(payload.sub).populate('role').exec();

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return user; // Injected into request.user
    }
}
