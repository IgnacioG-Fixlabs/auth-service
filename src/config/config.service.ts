import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import vault from 'node-vault';

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);
  private vaultClient: vault.client;
  private secrets: Record<string, any> = {};

  constructor() {
    if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
      this.logger.error(
        'VAULT_ADDR and VAULT_TOKEN environment variables must be set.',
      );
      throw new Error('Vault configuration is missing.');
    }
    this.vaultClient = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN,
    });
  }

  async onModuleInit() {
    await this.loadSecrets();
  }

  private async loadSecrets() {
    try {
      const response = await this.vaultClient.read('secret/data/video-app');
      this.secrets = response.data.data;
      console.log('Secrets loaded successfully from Vault.');
    } catch (error) {
      console.error('Failed to load secrets from Vault:', error);
      process.exit(1);
    }
  }

  get(key: string): any {
    return this.secrets[key] || process.env[key];
  }

  getJwtSecret(): string {
    const secret = this.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET not found in Vault or environment variables.');
    }
    return secret;
  }

  getDatabaseUrl(): string {
    const dbUser = this.secrets.POSTGRES_USER;
    const dbPassword = this.secrets.POSTGRES_PASSWORD;
    const dbName = this.secrets.POSTGRES_DB;
    const dbHost = this.get('POSTGRES_HOST') || 'postgres-db';
    const dbPort = this.get('POSTGRES_PORT') || 5432;
    return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }
  getTransportUrl(): string {
    const rabbitmqUri = this.get('RABBITMQ_URI');
    if (!rabbitmqUri) {
      throw new Error('RABBITMQ_URI not found in Vault or environment variables.');
    }
    return rabbitmqUri;
  }
}
