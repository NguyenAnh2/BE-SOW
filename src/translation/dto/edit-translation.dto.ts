import { IsOptional, IsString } from 'class-validator';

export class EditTranslationDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  section_key?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content_html?: string;
}
