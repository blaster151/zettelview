export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export interface LoggingService {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  getLogs(level?: LogLevel, limit?: number): LogEntry[];
  clearLogs(): void;
}

class LoggingServiceImpl implements LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isProduction = process.env.NODE_ENV === 'production';

  private addLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error
    };

    this.logs.push(logEntry);

    // Keep logs under max limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In development, also log to console
    if (!this.isProduction) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 
                           level === LogLevel.INFO ? 'info' : 'log';
      
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');
      if (error) {
        console.error(error);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.addLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.addLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.addLog(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.addLog(LogLevel.ERROR, message, context, error);
  }

  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const loggingService = new LoggingServiceImpl(); 