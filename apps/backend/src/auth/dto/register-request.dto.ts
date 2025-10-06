import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be at least 8 characters long and contain letters and numbers',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsOptional()
  @IsString()
  profileColor?: string;
}

export { PASSWORD_REGEX };
