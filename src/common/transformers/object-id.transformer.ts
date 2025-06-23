import { BadRequestException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { Types } from 'mongoose';

/**
 * Transforms a string or an array of strings to a MongoDB ObjectId or an array of ObjectIds.
 * @returns Decorator function
 * @example
 *
 * // To transform a single ID string:
 * ```ts
 * @IsOptional()
 * @IsObjectId()
 * @ToObjectId()
 * document_id?: Types.ObjectId;
 * ```
 *
 * // To transform an array of ID strings:
 * ```ts
 * @IsOptional()
 * @IsArray()
 * @IsObjectId({
 *   each: true,
 *   message: 'Each document ID must be a valid MongoDB ObjectId',
 * })
 * @ToObjectId()
 * document_ids?: Types.ObjectId[];
 * ```
 */
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
