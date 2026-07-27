import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
export interface DecodedToken extends jwt.JwtPayload {
    user_id: string;
}
export declare class AuthGuard implements CanActivate {
    private readonly configService;
    private readonly jwtSecret;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
