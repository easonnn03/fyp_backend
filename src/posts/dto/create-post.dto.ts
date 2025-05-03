import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  interestTagIds: string;
}
