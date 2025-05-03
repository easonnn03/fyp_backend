import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

//route prefixed with /auth
@Controller('auth')
export class AuthController {
  //Priavte: only accessible inside the class
  //Readonly: cannot be changed
  constructor(private readonly authService: AuthService) {}

  //method handles POST /user/register
  @Post('register')
  //Extracts JSON body from the request (@body)
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signIn(loginUserDto);
  }

  @Post('refresh')
  refreshAccessToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshAccessToken(body.refresh_token);
  }
}
