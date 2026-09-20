/**
 * LEGAKU Centralized Error Logging Service
 * Strictly sanitizes sensitive financial data, account numbers, receipts, AI chats, and auth tokens.
 */

export interface SanitizedErrorLog {
  id: string;
  timestamp: string;
  message: string;
  componentStack?: string;
  source: 'react_error_boundary' | 'network' | 'unhandled_rejection' | 'custom';
  context?: Record<string, unknown>;
}

const LOCAL_ERROR_LOGS_KEY = 'legaku_error_logs_store';

export class ErrorLoggingService {
  private static logs: SanitizedErrorLog[] = [];

  public static initialize(): void {
    const saved = localStorage.getItem(LOCAL_ERROR_LOGS_KEY);
    if (saved) {
      try {
        this.logs = JSON.parse(saved);
      } catch {
        this.logs = [];
      }
    }
  }

  /**
   * Log an error safely with all financial and confidential attributes stripped
   */
  public static logError(
    error: Error | string,
    source: SanitizedErrorLog['source'] = 'custom',
    extraContext?: Record<string, unknown>,
    componentStack?: string
  ): void {
    const message = typeof error === 'string' ? error : error?.message || 'Unknown error occurred';

    // Strict sanitization rules
    const cleanContext: Record<string, unknown> = {};
    if (extraContext) {
      const sensitiveKeys = [
        'amount',
        'nominal',
        'balance',
        'saldo',
        'account_number',
        'no_rekening',
        'password',
        'token',
        'jwt',
        'access_token',
        'refresh_token',
        'secret',
        'receipt_image',
        'chat_content',
        'message_text',
        'transcript',
      ];

      for (const [key, value] of Object.entries(extraContext)) {
        if (!sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          // ensure primitive or safe object
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanContext[key] = value;
          } else if (value === null || value === undefined) {
            cleanContext[key] = value;
          } else {
            cleanContext[key] = '[Object Sanitized]';
          }
        }
      }
    }

    const logEntry: SanitizedErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: message.substring(0, 300), // truncate length
      source,
      componentStack: componentStack ? componentStack.substring(0, 500) : undefined,
      context: Object.keys(cleanContext).length > 0 ? cleanContext : undefined,
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs = this.logs.slice(0, 50);

    try {
      localStorage.setItem(LOCAL_ERROR_LOGS_KEY, JSON.stringify(this.logs));
    } catch {
      // quota limit guard
    }

    // Console output in development only without sensitive values
    if (import.meta.env.DEV) {
      console.warn('[LEGAKU Sanitized Error]', logEntry.message, logEntry.source);
    }
  }

  public static getLogs(): SanitizedErrorLog[] {
    if (this.logs.length === 0) this.initialize();
    return this.logs;
  }

  public static clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(LOCAL_ERROR_LOGS_KEY);
  }
}

ErrorLoggingService.initialize();
