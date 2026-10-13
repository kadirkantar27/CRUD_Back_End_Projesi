import { prisma } from "../config/db.js"; 
import bcrypt from "bcrypt"; 
import { generateToken } from "../utils/generateToken.js"; // JWT token oluşturma fonksiyonu
const register = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Adım: Bu e-posta ile daha önce kayıt olunmuş mu kontrol et
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            // Eğer kullanıcı varsa hemen yanıt dön ve işlemi sonlandır (return)
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Adım: Belgede istenildiği üzere şifreyi şifrele (Hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Adım: şifrelenmiş şifre
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        // 4. Adım: Başarılı yanıt dön
        return res.status(201).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                },
            },  
        });

    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Error registering user" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Adım: Kullanıcıyı e-posta ile bul
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 2. Adım: Şifreyi doğrula
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 3. Adım: Şifre doğruysa Token üret
        // Not: Logout fonksiyonunuz çerezleri (cookie) temizlediğine göre, 
        generateToken(user.id, res); 

        // 4. Adım: Başarılı yanıt dön
        return res.status(200).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                },
            },
        });

    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Error logging in user" });
    }
};

const logout = (req, res) => {
    res.cookie("jwt", "", {
        expires: new Date(0), 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict", 
    });
    res.status(200).json({ message: "Logout successful" });
}; 
export { register, login, logout };