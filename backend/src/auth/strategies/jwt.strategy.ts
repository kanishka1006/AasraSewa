import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'fallback_secret', // Use env var in prod
        });
    }

    async validate(payload: any) {
        // Payload contains { sub: userId, role: roleName }
        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
            relations: ['role']
        });

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return user; // Injected into request.user
    }
}
