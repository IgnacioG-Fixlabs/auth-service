import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {ConfigModule} from "../config/config.module";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {ConfigService} from "../config/config.service";
import {ClientsModule, Transport} from "@nestjs/microservices";
import {JwtStrategy} from "./jwt.strategy";

@Module({
  imports: [
      ConfigModule,
      PassportModule,
      JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.getJwtSecret(),
                signOptions: { expiresIn: '60m' },
            }),
            inject: [ConfigService],
      }),
      ClientsModule.registerAsync([
          {
              name: 'USER_SERVICE',
              imports: [ConfigModule],
              useFactory: async (configService: ConfigService) => ({
                  transport: Transport.RMQ,
                  options: {
                      urls: [configService.getTransportUrl()],
                      queue: 'users_queue',
                      queueOptions: {
                          durable: false,
                      },
                  },
              }),
              inject: [ConfigService],
          },
      ])
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
