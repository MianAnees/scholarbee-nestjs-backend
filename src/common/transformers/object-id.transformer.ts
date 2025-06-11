import { BadRequestException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

export function ToObjectId() {
  return function (target: any, key: string) {
    Transform(({ value }: TransformFnParams) => {
      try {
        // Handle the array of object ids
        if (Array.isArray(value)) {
          return value.map((v) => {
            if (typeof v === 'string' && Types.ObjectId.isValid(v)) {
              return new Types.ObjectId(v);
            } else {
              throw new BadRequestException('Invalid ObjectId');
            }
          });
        }

        // Only transform if value is a string and is a valid ObjectId
        if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
          return new Types.ObjectId(value);
        }
        // Optionally, return the value as is if not valid
        return value;
      } catch (error) {
        return value;
      }
    })(target, key);
  };
}
