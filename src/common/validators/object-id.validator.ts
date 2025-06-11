import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'isValidObjectId', async: false })
export class IsValidObjectId implements ValidatorConstraintInterface {
  validate(text: string) {
    return Types.ObjectId.isValid(text);
  }

  defaultMessage() {
    return 'ID must be a valid MongoDB ObjectId';
  }
}

/**
 * Custom validator for MongoDB ObjectId
 * @param validationOptions - Validation options
 * @returns Decorator function
 *
 * @example
 * @IsOptional()
 * @IsArray()
 * @IsObjectId({ each: true, message: 'Each ID must be a valid MongoDB ObjectId' })
 * optional_object_id_array: string[]
 *
 * @example
 * @IsArray()
 * @ArrayNotEmpty()
 * @IsObjectId({ each: true, message: 'Each ID must be a valid MongoDB ObjectId' })
 * required_object_id_array: string[]
 *
 * @example
 * @IsString()
 * @IsNotEmpty()
 * @IsObjectId({ message: 'ID must be a valid MongoDB ObjectId' })
 * required_object_id: string
 *
 * @example
 * @IsOptional()
 * @IsString()
 * @IsObjectId({ message: 'ID must be a valid MongoDB ObjectId' })
 * optional_object_id: string
 */
export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidObjectId,
    });
  };
}
