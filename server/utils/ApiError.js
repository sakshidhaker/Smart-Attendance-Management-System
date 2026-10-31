// Controllers me `throw new ApiError(404, "Not found")` likhne ke liye
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

module.exports = ApiError;
