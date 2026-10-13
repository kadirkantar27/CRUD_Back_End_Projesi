import { io } from "socket.io-client";

// Postman'dan giriş (login) yaptığınızda dönen JWT Token'ı buraya yapıştırın
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzkxODk0NTAzLCJleHAiOjE3OTI0OTkzMDN9.uFaUskW2NpvDvqujCD9J83cmQNkd4rq_ZB4TRo5j09c";

// Sunucuya bağlanırken kimlik doğrulama (handshake) için token'ı gönderiyoruz
const socket = io("http://localhost:3000", {
    auth: {
        token: TOKEN
    }
});

socket.on("connect", () => {
    console.log("🟢 Sunucuya başarıyla bağlanıldı! Socket ID:", socket.id);
    console.log("Olaylar (Events) dinleniyor... Postman'dan bilet güncelleyerek test edebilirsiniz.");
});

socket.on("connect_error", (err) => {
    console.error("🔴 Bağlantı Hatası:", err.message);
});

// Bilet güncellendiğinde tetiklenecek olayı dinliyoruz
socket.on("ticket_updated", (data) => {
    console.log("🔔 [BİLDİRİM] Bilet Güncellendi:", data);
});

// Yeni yorum yapıldığında tetiklenecek olayı dinliyoruz
socket.on("new_comment", (data) => {
    console.log("💬 [BİLDİRİM] Yeni Yorum Eklendi:", data);
});