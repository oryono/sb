import { IsNotEmpty } from 'class-validator';

export class UpdateDto {
  @IsNotEmpty()
  driverId: number;
}
