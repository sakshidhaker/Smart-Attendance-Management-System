// lets controllers write `throw new ApiError(404, "Not found")`
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

module.exports = ApiError;
