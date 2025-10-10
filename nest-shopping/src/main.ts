import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('APP_PORT');

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  // Global ValidationPipe 적용
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // DTO에 없는 값 자동 제거
    forbidNonWhitelisted: true,   // DTO에 없는 값 오면 에러
    transform: true,              // JSON -> DTO 인스턴스 변환
    disableErrorMessages: false,  // 에러 메시지 보이기
    stopAtFirstError: true        // 첫 실패에서 중단
  }));

  await app.listen(port);
}
bootstrap();
