import { Expose } from 'class-transformer';

import { PublicUser } from '../../users/users.service';

export class AuthTokensDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  accessTokenExpiresIn!: number;
}

export class AuthResponseDto extends AuthTokensDto {
  @Expose()
  user!: PublicUser;
}
