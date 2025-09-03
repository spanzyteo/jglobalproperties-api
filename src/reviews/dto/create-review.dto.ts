/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'AtLeastOneId', async: false })
export class AtLeastOneIdConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const obj = args.object as CreateReviewDto;
    // Check that at least one ID is provided and is a non-empty string
    const hasValidLandId =
      obj.landId &&
      typeof obj.landId === 'string' &&
      obj.landId.trim().length > 0;
    const hasValidHouseId =
      obj.houseId &&
      typeof obj.houseId === 'string' &&
      obj.houseId.trim().length > 0;

    return Boolean(hasValidLandId || hasValidHouseId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments): string {
    return 'Either landId or houseId must be provided as a valid non-empty string';
  }
}

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseInt(value, 10))
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  @IsString()
  landId?: string;

  @IsOptional()
  @IsString()
  houseId?: string;

  // Apply custom validator to a property that validates the entire object
  @Validate(AtLeastOneIdConstraint)
  @IsOptional()
  _validateIds?: any;
}
