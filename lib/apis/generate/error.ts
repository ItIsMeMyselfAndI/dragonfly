export class GenerationError extends Error {
  code?: string;
  provider?: string;
  httpStatus?: number;

  constructor(
    message: string,
    code?: string,
    provider?: string,
    httpStatus?: number,
  ) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
    this.provider = provider;
    this.httpStatus = httpStatus;
  }
}
