export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

function write(level: LogLevel, scope: string, message: string, fields?: LogFields): void {
  const entry = { time: new Date().toISOString(), level, scope, message, ...fields };
  const line = JSON.stringify(entry);

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (scope: string, message: string, fields?: LogFields) => write("info", scope, message, fields),
  warn: (scope: string, message: string, fields?: LogFields) => write("warn", scope, message, fields),
  error: (scope: string, message: string, fields?: LogFields) => write("error", scope, message, fields),
};
