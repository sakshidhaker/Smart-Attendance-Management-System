// passes errors from async controllers to the errorHandler automatically (no repeated try/catch)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
