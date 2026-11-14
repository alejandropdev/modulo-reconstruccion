import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule.js';

const app = await NestFactory.create(AppModule);
const puerto = Number(process.env['PUERTO'] ?? 3001);
await app.listen(puerto);
console.log(`mock-modulos escuchando en http://localhost:${puerto}`);
