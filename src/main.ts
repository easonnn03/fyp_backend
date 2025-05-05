import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  //Create an instance of the app
  const app = await NestFactory.create(AppModule);

  //Enable CORS to receive requests from frontend
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  //Auto validates incoming requests against DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //remove properties not defined in DTO
      forbidNonWhitelisted: true, //throws error if extra properties
      transform: true, //convert incoming JSON object to actual class instance
    }),
  );

  //listening to the port 3001
  await app.listen(process.env.PORT ?? 3001);

  //npm run start:dev (run in dev mode, auto restart server when code changed, slower)
  //npm run start (faster but run once only)
  //npm run build (build for deploying on server)
}
bootstrap();

/*
1. Entry point of the application
2. Bootsrap app by creating a root instance (AppModule)
3. Allow HTTP requests/connection
4. Verify Input 
5. Ready and listen to port 
*/

/*
@Controller(): defines a controller class
@Get(), Post(), Put(), Delete(): defines HTTP methods
@Param(), @Query(), @Body(), @Headers(): extract parts of requests
@Injectable(), @Inject(), @Optional(): DI
@Module(): defines a module
@UseGuards(): authorization logic
@UsePipes(): transformation/validaiton logic
@UseInterceptors(): modify requests/response flows
*/

/*
main.ts -> start AppModule
AppModule -> imports UserModule 
UserModule -> registers UserController and UserService
UserService -> marked @Injectable()
UserController -> gets UserService, auto injected via constructor()
*/
