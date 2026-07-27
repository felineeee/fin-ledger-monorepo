"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
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
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
        return null;
    }
    return data ? user[data] : user;
});
