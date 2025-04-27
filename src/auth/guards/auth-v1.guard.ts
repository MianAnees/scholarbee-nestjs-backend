import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";
import { } from '@nestjs/jwt';


@Injectable()
export class AuthV1Guard implements CanActivate {
    constructor(private authService: AuthService) { }

    async canActivate(context: ExecutionContext) {
        try {
            // get the request object
            const request = context.switchToHttp().getRequest();

            // get the token from the request
            const authHeader = request.headers.authorization;

            if (!authHeader) {
                throw new UnauthorizedException('No authorization header found');
            }

            // Extract the token from "Bearer <token>"
            const [type, token] = authHeader.split(' ');

            if (type !== 'Bearer' || !token) {
                throw new UnauthorizedException('Invalid authorization header format');
            }

            // validate the token
            const { sub, ...user } = await this.authService.validateToken_v1(token);

            // Attach the user to the request object
            request.user = user;

            return true;
        } catch (error) {
            // check if the token is expired
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token expired');
            }

            throw new UnauthorizedException('Invalid token');
        }
    }
}