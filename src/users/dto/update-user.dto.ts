import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(1, 50)
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  courseName?: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsArray()
  interests?: string[];
}
