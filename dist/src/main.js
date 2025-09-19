"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Inventory & Loans API')
        .setDescription('API-Dokumentation')
        .setVersion('0.1.0')
        .addApiKey({
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-pin',
        description: 'Nur für Admin-Endpunkte',
    }, 'AdminPin')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    await app.listen(process.env.PORT || 3000);
    console.log(`Swagger UI: http://localhost:${process.env.PORT || 3000}/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map