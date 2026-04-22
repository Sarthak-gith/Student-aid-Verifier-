export function validateRequest(schema, source = "body") {
  return (req, res, next) => {
    try {
      req.validated = req.validated || {};
      req.validated[source] = schema.parse(req[source]);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
