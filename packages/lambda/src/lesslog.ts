/**
 * A copy paste of the main file of the amazing lesslog library, but
 * we're using ponyfills for PassThrough and inspect as LLRT doesn't
 * have them implemented.
 *
 * https://github.com/robdasilva/lesslog/blob/main/index.ts
 */

import { PassThrough } from "streamx";
import { inspect } from "node-inspect-extracted";

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

export type LogContext = Record<string, unknown> | null;

export interface ILogEntry {
  context: LogContext;
  label: string;
  level: LogLevel;
  message: string;
  timestamp: number;
}

export type LogFormatFunction = (input: ILogEntry) => string;

function formatLogContext(context: NonNullable<LogContext>) {
  try {
    return JSON.stringify(context);
  } catch (_) {
    return `\r${inspect(context).replaceAll("\n", "\r")}`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatLog({ context, label, level, message, timestamp }: ILogEntry) {
  return [
    // These seem to be added by LLRT automatically so commenting them out for now
    // new Date(timestamp).toISOString(),
    // label,
    // LogLevel[level],
    message.trim(),
    context && formatLogContext(context),
  ]
    .filter((item) => !!item)
    .join("\t");
}

export class Log {
  private readonly logStream = new PassThrough();
  private readonly format: LogFormatFunction;

  private _context: LogContext = null;
  private _label = "";

  constructor(format: LogFormatFunction = formatLog) {
    if (typeof format !== "function") {
      throw new TypeError("Expected `format` to be a function");
    }

    this.format = format;
  }

  get context() {
    return this._context;
  }

  set context(context: LogContext) {
    if (typeof context !== "object") {
      throw new TypeError("Expected `context` to be an object");
    }

    this._context = context;
  }

  get label() {
    return this._label;
  }

  set label(label: string) {
    if (typeof label !== "string") {
      throw new TypeError("Expected `label` to be a string");
    }

    this._label = label.trim();
  }

  clear() {
    this.logStream.read();
  }

  /**
   * PassThrough in streamx doesn't have readableLength, so we've implemented
   * flush differently in our lesslog implementation
   */
  flush() {
    let chunk;
    let output = "";
    while ((chunk = this.logStream.read()) !== null) {
      output += chunk;
    }
    if (output) {
      // Remove trailing newline to avoid double newlines
      const trimmedOutput = output.replace(/\n$/, "");
      console.log(trimmedOutput);
    }
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext) {
    console.log(message);
    if (typeof message !== "string") {
      throw new TypeError("Expected `message` to be a string");
    }

    const entry =
      this.format({
        context:
          !!context || (this._context && Object.keys(this._context).length) ? { ...this.context, ...context } : null,
        label: this._label,
        level,
        message,
        timestamp: Date.now(),
      }) + "\n";

    switch (level) {
      case LogLevel.ERROR:
        this.flush();
      // eslint-disable-next-line no-fallthrough
      case LogLevel.WARN:
        // Replaced the process.stderr.write(entry) with:
        console.error(entry.replace(/\n$/, ""));
        break;
      case LogLevel.DEBUG:
        if (
          !process.env.DEBUG ||
          (process.env.DEBUG !== "1" &&
            process.env.DEBUG.toLowerCase() !== "on" &&
            process.env.DEBUG.toLowerCase() !== "true" &&
            process.env.DEBUG.toLowerCase() !== "yes")
        ) {
          this.logStream.write(entry);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        // Replaced the process.stdout.write(entry) with:
        console.log(entry.replace(/\n$/, ""));
    }
  }

  debug(message: string, context?: LogContext) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.writeLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.writeLog(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.writeLog(LogLevel.ERROR, message, context);
  }
}

export const log = new Log();
