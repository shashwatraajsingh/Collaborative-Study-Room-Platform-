import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]): BadRequestException => {
        const fieldErrors = formatValidationErrors(errors);
        return new BadRequestException(fieldErrors);
      },
    });
  }
}

function formatValidationErrors(
  errors: ValidationError[],
  parentField = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const fieldName = parentField
      ? `${parentField}.${error.property}`
      : error.property;

    if (error.constraints) {
      result[fieldName] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      const childErrors = formatValidationErrors(error.children, fieldName);
      Object.assign(result, childErrors);
    }
  }

  return result;
}
