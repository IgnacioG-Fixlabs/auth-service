import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from './config/config.service';
import {ValidationPipe} from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  app.enableShutdownHooks();
  await app.listen(port);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Auth service is running on: ${await app.getUrl()}`);
}
void bootstrap();
