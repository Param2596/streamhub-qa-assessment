import type { NextFunction, Request, Response } from "express";

export type ErrorCode =
  | "INVALID_PARAMETER"
  | "UNEXPECTED_PARAMETER"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly field?: string;

  constructor(status: number, code: ErrorCode, message: string, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export function methodNotAllowed(...allowed: string[]) {
  const allowHeader = allowed.length > 0 ? allowed.join(", ") : "GET";
  return (_req: Request, res: Response): void => {
    res.set("Allow", allowHeader);
    res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed",
      },
    });
  };
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
}

function isJsonParseError(err: unknown): boolean {
  return err instanceof SyntaxError && "status" in err && err.status === 400;
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (isJsonParseError(err)) {
    res.status(400).json({
      error: {
        code: "INVALID_PARAMETER",
        message: "Request body must be valid JSON",
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    const body: { code: ErrorCode; message: string; field?: string } = {
      code: err.code,
      message: err.message,
    };
    if (err.field !== undefined) {
      body.field = err.field;
    }
    res.status(err.status).json({ error: body });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected error",
    },
  });
}
