import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true populates req.rawBody on every request (Nest's
  // documented mechanism for this) without disabling normal JSON parsing
  // elsewhere - needed by StripeCheckoutService.handleWebhookEvent() to
  // verify the webhook signature against the exact bytes Stripe signed,
  // not a re-serialized JSON body that could differ byte-for-byte.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
