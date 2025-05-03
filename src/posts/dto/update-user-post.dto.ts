import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class UpdatePostDto {
  @IsNotEmpty()
  @IsString()
  postId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsString()
  content: string;

  @IsArray()
  @ArrayNotEmpty()
  interestTagIds: string[];
}
