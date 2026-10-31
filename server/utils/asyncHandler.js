// async controller ke error ko automatically errorHandler tak pahunchata hai (try/catch baar-baar nahi likhna padta)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
