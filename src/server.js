import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// 1. Yeni importlar
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// 2. Express'i HTTP Sunucusuna Sarmalıyoruz
const httpServer = http.createServer(app);

// 3. Socket.IO Kurulumu
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// io objesini Express'in içine gömüyoruz ki daha sonra kontrolcülerden (controllers) erişebilelim
app.set("io", io);

// 4. Soket Kimlik Doğrulaması (Socket Authentication)
// Bağlantı kurulmadan hemen önce çalışır. İstemcinin token göndermesini zorunlu kılar.
io.use((socket, next) => {
    // İstemci (client) bağlanırken token'ı 'auth' objesi içinde göndermeli
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error("Bağlantı reddedildi: Token bulunamadı"));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Doğrulanan kullanıcı bilgisini sokete bağla
        next(); // Kalkanı aç, bağlanmaya izin ver
    } catch (err) {
        return next(new Error("Bağlantı reddedildi: Geçersiz token"));
    }
});

// 5. Bağlantı ve Odalara (Rooms) Katılma
io.on("connection", (socket) => {
    console.log(`✅ Yeni Socket bağlantısı: ${socket.id} (Kullanıcı ID: ${socket.user.id})`);

    // Her kullanıcı kendi ID'siyle isimlendirilmiş özel bir "Odaya" katılır.
    // Böylece sadece ilgili kullanıcılara bildirim fırlatabiliriz[cite: 1].
    socket.join(`user_${socket.user.id}`);

    socket.on("disconnect", () => {
        console.log(`❌ Socket bağlantısı koptu: ${socket.id}`);
    });
});

app.use(express.json());
app.use(cookieParser());

// Rotalar
app.use("/auth", authRoutes);
app.use("/tickets", ticketRoutes);

// DİKKAT: app.listen YERİNE httpServer.listen KULLANIYORUZ
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});