import { format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '../config/config.service';
import Transport from 'winston-transport';

// Un transporte TCP simple para Logstash
class LogstashTcpTransport extends Transport {
  private client: any; // Reemplazar con un cliente TCP real si es necesario
  constructor(opts) {
    super(opts);
    // Aquí iría la lógica para conectar al socket TCP de Logstash
    // Por simplicidad, usaremos un transporte de consola con formato JSON
    // que es lo que Logstash espera.
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    // Lógica para enviar a Logstash
    callback();
  }
}

export const loggerFactory = (configService: ConfigService) => {
  const logstashHost = configService.get('LOGSTASH_HOST');
  const logstashPort = configService.get('LOGSTASH_PORT');

  return WinstonModule.createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json(), // ¡Clave! Enviar logs en formato JSON [1]
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
      new LogstashTcpTransport({
        host: logstashHost || 'localhost',
        port: logstashPort || 5000,
      }),
    ],
  });
};
