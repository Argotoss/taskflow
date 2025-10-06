import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserInput {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsOptional()
  @IsString()
  profileColor?: string;
}
