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

// create a custom validator for object id
export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ValidatorConstraint,
    });
  };
}