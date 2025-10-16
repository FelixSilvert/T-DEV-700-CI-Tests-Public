import { DocumentBuilder } from "@nestjs/swagger";

export const swaggerConfig = new DocumentBuilder()
  .setTitle("Trinity")
  .setDescription(
    'API documentation fot Trinity, need JWT token in "Authorize" (you can login with /auth/login)',
  )
  .setVersion("2.0")
  .addTag("trinity")
  .addServer("/api")
  .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "JWT")
  .build();
