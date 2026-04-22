import { verifySessionToken } from "../services/authService.js";

export function authenticateAuthority(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.auth = verifySessionToken(token);

    if (req.auth.role === "Student") {
      return res.status(403).json({ message: "Students are not allowed to access this route." });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authorization token." });
  }
}
