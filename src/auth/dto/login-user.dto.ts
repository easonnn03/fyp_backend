import { IsEmail, MinLength } from 'class-validator';

/*
DTO Data Transfer Object (for velidate received data)
Defines the shape of data receievd/expected
*/
export class LoginUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
