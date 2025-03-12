import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLoggerService implements NestLoggerService {
    private logDir: string;
    private logStream: fs.WriteStream;

    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');

        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    }

    log(message: any, context?: string) {
        this.writeToLog('INFO', message, context);
    }

    error(message: any, trace?: string, context?: string) {
        this.writeToLog('ERROR', message, context, trace);
    }

    warn(message: any, context?: string) {
        this.writeToLog('WARN', message, context);
    }

    debug(message: any, context?: string) {
        this.writeToLog('DEBUG', message, context);
    }

    verbose(message: any, context?: string) {
        this.writeToLog('VERBOSE', message, context);
    }

    private writeToLog(level: string, message: any, context?: string, trace?: string) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${context ? `[${context}] ` : ''}${message}${trace ? `\n${trace}` : ''}`;

        // Write to console
        console.log(formattedMessage);

        // Write to file
        this.logStream.write(formattedMessage + '\n');
    }
} 