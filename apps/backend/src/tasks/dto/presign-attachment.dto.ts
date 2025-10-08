import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class PresignAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contentType!: string;

  @IsInt()
  @IsPositive()
  fileSize!: number;
}
