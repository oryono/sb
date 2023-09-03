import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  password: string;
}
