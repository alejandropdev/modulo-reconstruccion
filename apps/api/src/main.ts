import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './AppModule.js';
import { leerConfiguracion } from './config/Configuracion.js';
import { FiltroExcepciones } from './http/FiltroExcepciones.js';

const config = leerConfiguracion();
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api/v1');
app.useGlobalFilters(new FiltroExcepciones());
app.enableShutdownHooks();

const documento = SwaggerModule.createDocument(
  app,
  new DocumentBuilder().setTitle('Módulo de Reconstrucción').setVersion('1.0').addBearerAuth().build(),
);
SwaggerModule.setup('api/docs', app, documento);

await app.listen(config.PUERTO_API);
console.log(`API en http://localhost:${config.PUERTO_API}/api/v1 (Swagger en /api/docs)`);
