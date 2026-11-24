import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        config: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        // Refresh tokens are not access tokens. Payloads with no type stay valid until they expire.
        if (payload?.type === 'refresh') {
            throw new UnauthorizedException('Refresh token cannot be used as an access token');
        }
        const user = await this.userModel.findById(payload.sub).populate('role').exec();

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return user; // Injected into request.user
    }
}
