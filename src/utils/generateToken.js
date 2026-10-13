import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const payload = { id: userId };
    
    // Süreyi .env'den al, yoksa varsayılan olarak "7d" (7 gün) yap
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d"; 

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Sadece production'da true (HTTPS)
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    });
    
    return token;
};