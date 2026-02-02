import { prisma } from './prisma';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogOptions {
    level?: LogLevel;
    source?: string;
    details?: any;
}

export async function logSystem(message: string, options: LogOptions = {}) {
    const { level = 'INFO', source = 'SYSTEM', details = null } = options;

    console.log(`[${level}] [${source}] ${message}`);

    try {
        if ((prisma as any).systemLog) {
            await (prisma as any).systemLog.create({
                data: {
                    level,
                    message,
                    source,
                    details: details ? JSON.stringify(details) : null
                }
            });
        }
    } catch (err) {
        console.error('Failed to write to system log:', err);
    }
}

export const logger = {
    info: (msg: string, source?: string, details?: any) => logSystem(msg, { level: 'INFO', source, details }),
    warn: (msg: string, source?: string, details?: any) => logSystem(msg, { level: 'WARN', source, details }),
    error: (msg: string, source?: string, details?: any) => logSystem(msg, { level: 'ERROR', source, details }),
    debug: (msg: string, source?: string, details?: any) => logSystem(msg, { level: 'DEBUG', source, details }),
};
