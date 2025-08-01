import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ReporterService } from 'nestjs-metrics-reporter';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Pedir al servicio de usuarios que nos devuelva el usuario por email
    const user = await lastValueFrom(this.usersClient.send({ cmd: 'get_user_by_email' }, { email }));
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password,...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    ReporterService.counter('auth_logins_total', { source: 'api' }); // Métrica de Prometheus
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: any) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 2. Enviar un evento al servicio de usuarios para que cree el usuario
    this.usersClient.emit('user_created', {
      email: createUserDto.email,
      password: hashedPassword,
    });

    ReporterService.counter('auth_registrations_total', { source: 'api' }); // Métrica de Prometheus
    return { message: 'Registration request received.' };
  }
}