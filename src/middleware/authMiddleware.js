import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const protect = async (req, res, next) => {
    let token;

    // Token'ı çerezlerden (cookies) alıyoruz (generateToken'da 'jwt' adıyla kaydettiğinizi varsayıyorum)
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            // Token'ın sahte olup olmadığını veya süresinin bitip bitmediğini gizli anahtarımızla kontrol ediyoruz
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Token geçerliyse, veri tabanından bu kullanıcıyı bul (şifresi hariç) ve req.user içine at
            req.user = await prisma.user.findUnique({
                where: { id: decoded.id }, // generateToken içinde id'yi 'userId' olarak şifrelediğinizi varsayıyorum
                select: { id: true, email: true, role: true } // Şifreyi güvenlik gereği dahil etmiyoruz
            });

            // Kullanıcı doğrulandı, bir sonraki işleme (örneğin bilet oluşturmaya) geçebilirsin
            next();
        } catch (error) {
            console.error("Token doğrulama hatası:", error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        // Eğer token hiç yoksa (kullanıcı giriş yapmamışsa)
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

export { protect };