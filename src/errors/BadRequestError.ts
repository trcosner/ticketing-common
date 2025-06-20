import { CustomError } from "./CustomError";

export class BadRequestError extends CustomError {
  statusCode = 400;
  constructor(public message: string) {
    super(message);

    // extending built in class
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
