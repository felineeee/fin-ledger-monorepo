/**
 * Custom decorator to extract the authenticated user object (or a specific property)
 * attached to the request by authentication guards.
 *
 * @example
 * // Get full user payload
 * @Get('me')
 * getProfile(@CurrentUser() user: UserPayload) { ... }
 *
 * @example
 * // Extract specific property
 * @Get('id')
 * getUserId(@CurrentUser('id') userId: string) { ... }
 */
export declare const CurrentUser: (...dataOrPipes: (string | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
