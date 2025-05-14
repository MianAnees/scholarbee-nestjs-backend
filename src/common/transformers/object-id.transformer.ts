import { Transform, TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

export function ToObjectId() {
  return function (target: any, key: string) {
    Transform(({ value }: TransformFnParams) => {
      // Only transform if value is a string and is a valid ObjectId
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        return new Types.ObjectId(value);
      }
      // Optionally, return the value as is if not valid
      return value;
    })(target, key);
  };
}
