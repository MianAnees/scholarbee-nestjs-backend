import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

/**
 * Decorator that transforms and validates a value as a boolean.
 * Only accepts 'true', 'false', '1', '0', true, false, 1, 0 as valid inputs.
 * Other values will cause validation to fail.
 *
 * Usage: @IsValidBoolean() myField: boolean;
 */
export function IsValidBoolean() {
  return function (target: any, propertyKey: string) {
    // Apply the class-transformer Transform decorator
    Transform(({ value }) => {
      // If already a boolean, return as is
      if (typeof value === 'boolean') return value;

      // Handle true values
      if (value === 'true' /* || value === '1' || value === 1 */) return true;

      // Handle false values
      if (value === 'false' /* || value === '0' || value === 0 */) return false;

      // Invalid value - return original to trigger validation error
      return value;
    })(target, propertyKey);

    // Apply the class-validator IsBoolean decorator
    IsBoolean({
      //   message: `${propertyKey} must be a boolean value (true, false, 1, 0)`,
      message: `${propertyKey} must be a boolean value (true, false)`,
    })(target, propertyKey);
  };
}
