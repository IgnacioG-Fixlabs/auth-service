import {Injectable, Inject, Logger} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ReporterService } from 'nestjs-metrics-reporter';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
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

    this.usersClient.emit('user_created', {
      email: createUserDto.email,
      password: hashedPassword,
    });

    ReporterService.counter('auth_registrations_total', { source: 'api' }); // Métrica de Prometheus
    this.logger.log(`Registration event emitted for user: ${createUserDto.email}`);
    return { message: 'Registration request received.' };
  }
}