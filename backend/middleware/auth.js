import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // Remove "Bearer " prefix if present
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;

        // Decoded token contains user payload (e.g. { id: "..." })
        // Using "SECRET123" as defined in authRoutes.js (ideally move to env variable later)
        const decoded = jwt.verify(tokenString, "SECRET123");

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

export default auth;
