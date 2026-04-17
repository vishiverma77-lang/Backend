import jwt from "jsonwebtoken";

export const authenticateAdmin = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided, access denied." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN || 'rairoshan_admin_secret_key_2024');
        req.user = decoded; // Contains id and role
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Admin access required." });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is invalid or expired." });
    }
};

export const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided, access denied." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_USER || 'rairoshan_user_secret_key_2024');
        req.user = decoded; // Contains id and role
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is invalid or expired." });
    }
};
