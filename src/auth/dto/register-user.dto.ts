import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

/*
DTO Data Transfer Object (for velidate received data)
Defines the shape of data receievd/expected
*/
export class RegisterUserDto {
  @IsNotEmpty()
  tpNumber: string;

  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
