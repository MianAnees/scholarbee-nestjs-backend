import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
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