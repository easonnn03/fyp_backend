import { IsString, Length, IsNotEmpty } from 'class-validator';

export class AddFriendDto {
  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  sender: string;

  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  addressee: string;

  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  status: string;
}
