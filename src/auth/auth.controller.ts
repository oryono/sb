import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegistrationDto } from './dto';
import { Public } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Register User
  @Public()
  @Post('user/register')
  registerUser(@Body() registerDto: RegistrationDto) {
    return this.authService.registerUser(registerDto);
  }

  @Public()
  @HttpCode(200)
  @Post('user/login')
  loginUser(@Body() authDto: AuthDto) {
    return this.authService.loginUser(authDto);
  }

  @Public()
  @Post('driver/register')
  registerDriver(@Body() registerDto: RegistrationDto) {
    return this.authService.registerDriver(registerDto);
  }

  @Public()
  @Post('driver/login')
  loginDriver(@Body() authDto: AuthDto) {
    return this.authService.loginDriver(authDto);
  }
}
