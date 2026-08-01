// src/debug.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import * as util from 'util';

@Catch()
export class DebugExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // 1. Force Node.js to print the raw object with deep inspection
    console.log('RAW EXCEPTION CAUGHT:');
    console.log(
      util.inspect(exception, { showHidden: true, depth: null, colors: true }),
    );

    // 2. Return a generic 500 so the app doesn't crash
    const status = exception?.status || exception?.statusCode || 500;
    response.status(status).json({
      statusCode: status,
      message: exception?.message || 'Internal server error',
      raw: exception, // You can remove this before pushing to production!
    });
  }
}
