import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/** Swagger decorator: marks endpoint as requiring Bearer JWT */
export const ApiAuth = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Unauthorized — token missing or invalid' }),
  );
