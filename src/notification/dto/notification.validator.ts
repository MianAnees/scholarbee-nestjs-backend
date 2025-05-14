import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';
import { AudienceType } from '../schemas/notification.schema';

export interface NotificationAudience {
  audienceType: AudienceType;
  isGlobal: boolean;
  recipients?: { id: Types.ObjectId; isRead?: boolean }[];
}

@ValidatorConstraint({ async: false })
export class IsAudienceMutuallyExclusiveConstraint
  implements ValidatorConstraintInterface
{
  validate(audience: NotificationAudience, args: ValidationArguments) {
    if (audience.isGlobal) {
      // If isGlobal is true, recipients must be undefined (not even an empty array)
      return audience.recipients === undefined;
    } else {
      // If isGlobal is false, recipients must be provided and must have at least 1 item
      return (
        Array.isArray(audience.recipients) && audience.recipients.length > 0
      );
    }
  }

  defaultMessage(args: ValidationArguments) {
    return "If 'isGlobal' is false, a non-empty array of recipients must be provided. If 'isGlobal' is true, recipients must not be provided.";
  }
}

export function IsAudienceMutuallyExclusive(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAudienceMutuallyExclusive',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsAudienceMutuallyExclusiveConstraint,
    });
  };
}
