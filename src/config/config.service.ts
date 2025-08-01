import { Injectable, OnModuleInit } from '@nestjs/common';
import vault from 'node-vault';

@Injectable()
export class ConfigService implements OnModuleInit {
  private vaultClient: vault.client;
  private secrets: Record<string, any> = {};

  constructor() {
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
      process.exit(1); // Detener la app si no se pueden cargar los secretos
    }
  }

  get(key: string): any {
    return this.secrets[key] || process.env[key];
  }

  getJwtSecret(): string {
    return this.secrets.JWT_SECRET;
  }

  getDatabaseUrl(): string {
    const dbUser = this.secrets.POSTGRES_USER;
    const dbPassword = this.secrets.POSTGRES_PASSWORD;
    const dbName = this.secrets.POSTGRES_DB;
    const dbHost = this.get('POSTGRES_HOST') || 'postgres-db';
    const dbPort = this.get('POSTGRES_PORT') || 5432;
    return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }
}
