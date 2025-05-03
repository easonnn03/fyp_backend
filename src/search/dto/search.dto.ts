import { IsOptional, IsString, IsIn } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsOptional()
  requesterId?: string; // 👈 ADD THIS

  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  tagId?: string;

  @IsString()
  @IsIn(['user', 'post', 'tag'])
  @IsOptional()
  type?: 'user' | 'post' | 'tag';

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsOptional()
  limit?: number;
}
