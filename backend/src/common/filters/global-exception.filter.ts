import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { COMMON_ERROR_MESSAGES } from '../http/api-messages';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private getStatus(exception: unknown) {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown) {
    if (!(exception instanceof HttpException)) {
      return COMMON_ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    const responseBody = response as
      | {
          message?: string | string[];
        }
      | undefined;

    if (responseBody?.message) {
      return responseBody.message;
    }

    return COMMON_ERROR_MESSAGES.UNEXPECTED_ERROR;
  }
}
