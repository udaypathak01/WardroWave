export class ApiError extends Error {
  constructor(statusCode, message, codeOrDetails = undefined, detailsOrCode = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (typeof codeOrDetails === 'string') {
      this.code = codeOrDetails;
      this.details = detailsOrCode;
    } else {
      this.details = codeOrDetails;
      this.code = typeof detailsOrCode === 'string'
        ? detailsOrCode
        : codeOrDetails?.code;
    }
  }
}
