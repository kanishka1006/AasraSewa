import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiRequest, ApiRequestDocument } from './api-request.schema';

@Injectable()
export class ApiRequestInterceptor implements NestInterceptor {
    private readonly logger = new Logger(ApiRequestInterceptor.name);

    constructor(
        @InjectModel(ApiRequest.name) private apiRequestModel: Model<ApiRequestDocument>,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const { method, url, ip, body, query, headers, user } = request;
        const userAgent = headers['user-agent'] || '';

        const now = Date.now();

        return next.handle().pipe(
            tap(async () => {
                const latencyMs = Date.now() - now;
                const statusCode = response.statusCode;

                try {
                    const logEntry = new this.apiRequestModel({
                        method,
                        url,
                        statusCode,
                        latencyMs,
                        ipAddress: ip,
                        body,
                        query,
                        userAgent,
                        timestamp: new Date(),
                        userId: user?.id || null,
                    });

                    await logEntry.save();
                } catch (error) {
                    this.logger.error(`Failed to save API request log to MongoDB: ${error.message}`);
                }
            }),
        );
    }
}
