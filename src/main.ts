import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Startet die NestJS-Anwendung.
 *
 * Erstellt die App, aktiviert CORS, setzt eine globale `ValidationPipe`
 * (Whitelisting + automatische Transformation inkl. impliziter Konvertierung)
 * und initialisiert die Swagger-UI unter `/docs`.
 *
 * @remarks
 * - **Admin-Auth (leichtgewichtig):** Swagger ist mit einem API-Key im Header
 *   konfiguriert (`x-admin-pin`). Dieser Header ist nur für Admin-Endpunkte
 *   relevant und wird in der UI unter „Authorize“ (Security-Scheme **AdminPin**)
 *   hinterlegt.
 * - **Port:** Verwendet `process.env.PORT` oder 3000.
 *
 * @returns Promise, das erfüllt wird, sobald der HTTP-Server lauscht.
 */
async function bootstrap() {
  // App erzeugen; CORS aktivieren (lokale FE/BE-Entwicklung, einfacher Betrieb)
  const app = await NestFactory.create(AppModule, { cors: true });
  // Globale Validierung: unerlaubte Felder entfernen (whitelist) und DTOs/Primitive transformieren
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Unbekannte Properties werden aus Payloads entfernt
      transform: true, // Payloads -> DTOs/Primitive (z. B. Strings zu Zahlen/Datumswerten)
      transformOptions: { enableImplicitConversion: true }, // implizite Typkonvertierung erlauben
    }),
  );

  // Swagger-Grundkonfiguration (Titel, Beschreibung, Version, Security-Scheme)
  const config = new DocumentBuilder()
    .setTitle('Inventory & Loans API')
    .setDescription('API-Dokumentation')
    .setVersion('0.1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-pin',
        description: 'Nur für Admin-Endpunkte',
      },
      // Bezeichner des Security-Schemes (muss mit @ApiSecurity(...) / Swagger-UI übereinstimmen)
      'AdminPin',
    )
    .build();

  // OpenAPI-Dokument erzeugen und Swagger-UI unter /docs bereitstellen
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true }, // merkt sich eingegebenen API-Key beim Reload
  });

  // Server starten
  await app.listen(process.env.PORT || 3000);
  console.log(`Swagger UI: http://localhost:${process.env.PORT || 3000}/docs`);
}
void bootstrap();
