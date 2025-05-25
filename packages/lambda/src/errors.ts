import { CustomError } from "ts-custom-error";

/**
 * Using this page as a guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
 */

export class ErrorWithCode extends CustomError {
  public code = 500;
}

export class InternalServerError extends ErrorWithCode {
  public code = 500;

  constructor(message = "An internal server error occurred") {
    super(message);
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "InternalServerError" });
  }
}

export class ServiceUnavailableError extends ErrorWithCode {
  public code = 503;

  constructor(message = "Service is currently unavailable") {
    super(message);
    Object.defineProperty(this, "name", { value: "ServiceUnavailableError" });
  }
}

export class BadRequestError extends ErrorWithCode {
  public code = 400;

  constructor(message = "Invalid request") {
    super(message);
    Object.defineProperty(this, "name", { value: "BadRequestError" });
  }
}

export class NotFoundError extends ErrorWithCode {
  public code = 404;

  constructor(message = "Resource not found") {
    super(message);
    Object.defineProperty(this, "name", { value: "NotFoundError" });
  }
}
