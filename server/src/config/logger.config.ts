import { LoggerModuleAsyncParams } from "nestjs-pino";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const loggerConfig: LoggerModuleAsyncParams = {
  useFactory: () => {
    const isDocker = existsSync("/.dockerenv");

    const logsDir = isDocker
      ? "/usr/src/app/logs"
      : join(process.cwd(), "logs");

    return {
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",

        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  translateTime: "yyyy-mm-dd HH:MM:ss",
                  ignore: "pid,hostname",
                  singleLine: true,
                },
              }
            : {
                target: "pino/file",
                options: {
                  destination: join(logsDir, "app.log"),
                  mkdir: true,
                },
              },

        autoLogging: {
          ignore: (req) =>
            typeof req.url === "string" &&
            (req.url.startsWith("/health") ||
              req.url.startsWith("/metrics") ||
              req.url.includes("favicon.ico")),
        },
      },
    };
  },
};
