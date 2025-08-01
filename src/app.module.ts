import { Module, Logger, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { WinstonModule } from 'nest-winston';
import { ReporterModule } from 'nestjs-metrics-reporter';
import { format, transports } from 'winston';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';

@Module({
    imports: [
        ConfigModule,
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                transports: [
                    new transports.Console({
                        format: format.combine(
                            format.timestamp(),
                            format.colorize(),
                            format.simple()
                        ),
                    }),
                    new transports.File({
                        filename: 'logs/error.log',
                        level: 'error',
                        format: format.combine(
                            format.timestamp(),
                            format.json()
                        ),
                    }),
                    new transports.File({
                        filename: 'logs/combined.log',
                        format: format.combine(
                            format.timestamp(),
                            format.json()
                        ),
                    }),
                ],
            }),
            inject: [ConfigService],
        }),
        ReporterModule.forRoot({
            defaultMetricsEnabled: true,
            defaultLabels: {
                app: 'auth-service',
            },
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                url: configService.getDatabaseUrl(),
                autoLoadEntities: true,
                synchronize: configService.get('NODE_ENV') !== 'production',
            }),
            inject: [ConfigService],
        }),
        TerminusModule,
        AuthModule,
    ],
    controllers: [HealthController, MetricsController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ValidationPipe,
        },
    ],
})
export class AppModule {}