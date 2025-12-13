/**
 * Using this page as a guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
 */

export class HttpError extends Error {
  public expose = true;
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "An internal server error occurred") {
    super(500, message);
    // Set name explicitly as minification can mangle class names
    this.name = "InternalServerError";
  }
}

export class ServiceUnavailable extends HttpError {
  constructor(message = "Service is currently unavailable") {
    super(503, message);
    this.name = "ServiceUnavailable";
  }
}

export class BadRequest extends HttpError {
  constructor(message = "Invalid request") {
    super(400, message);
    this.name = "BadRequest";
  }
}

export class NotFound extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFound";
  }
}

export class Forbidden extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "Forbidden";
  }
}
