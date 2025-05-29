// Middleware to protect routes for authenticated users
export default function requireAuth(handler) {
  return async (req, res) => {
    const user = req.cookies.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return handler(req, res);
  };
}
