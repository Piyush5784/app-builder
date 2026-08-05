interface LogFields {
  [key: string]: unknown;
}

function write(
  level: "info" | "error",
  scope: string,
  message: string,
  fields?: LogFields,
): void {
  const entry = {
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

// Only three things are worth a log line here: which tool ran, which
// provider/model handled a call, and errors. Sandbox lifecycle, per-step
// loop chatter, and socket connect/disconnect were pure noise.
export const logger = {
  tool: (name: string) => write("info", "tool", name),
  model: (provider: string, model: string) =>
    write("info", "model", `${provider}/${model}`),
  error: (scope: string, message: string, fields?: LogFields) =>
    write("error", scope, message, fields),
};
