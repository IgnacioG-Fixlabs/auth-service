import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        password: string;
    };
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    async register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req: AuthRequest) {
        return this.authService.validateUser(req.user.email, req.user.password)
    }
}