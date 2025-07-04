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
 * @example how to use it for an optional array of object ids
 * ```ts
 * @IsOptional()
 * @IsArray()
 * @IsObjectId({ each: true, message: 'Each ID must be a valid MongoDB ObjectId' })
 * optional_object_id_array: string[]
 * ```
 * @example how to use it for a required array of object ids
 * ```ts
 * @IsArray()
 * @ArrayNotEmpty()
 * @IsObjectId({ each: true, message: 'Each ID must be a valid MongoDB ObjectId' })
 * required_object_id_array: string[]
 * ```
 *
 * @example how to use it for a required object id
 * ```ts
 * @IsString()
 * @IsNotEmpty()
 * @IsObjectId({ message: 'ID must be a valid MongoDB ObjectId' })
 * required_object_id: string
 * ```
 *
 * @example how to use it for an optional object id
 * ```ts
 * @IsOptional()
 * @IsString()
 * @IsObjectId({ message: 'ID must be a valid MongoDB ObjectId' })
 * optional_object_id: string
 * ```
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
