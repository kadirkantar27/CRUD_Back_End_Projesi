import nodemailer from "nodemailer";

// 1. Transporter (Taşıyıcı) Kurulumu[cite: 1]
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// 2. Yeni Bilet Oluşturulduğunda Kullanıcıya Gidecek E-posta[cite: 1]
const sendTicketCreatedEmail = async (userEmail, ticketTitle) => {
    try {
        const info = await transporter.sendMail({
            from: '"Destek Sistemi" <no-reply@destek.com>',
            to: userEmail,
            subject: "Biletiniz Alındı",
            text: `Merhaba, "${ticketTitle}" başlıklı biletiniz başarıyla oluşturulmuştur. Ekibimiz en kısa sürede inceleyecektir.`,
        });
        console.log("Bilet Oluşturma E-postası gönderildi: %s", info.messageId);
        
        console.log("Önizleme URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        
        console.error("Bilet oluşturma e-postası gönderilemedi:", error);
    }
};

// 3. Bilet Bir Temsilciye Atandığında Temsilciye Gidecek E-posta[cite: 1]
const sendTicketAssignedEmail = async (agentEmail, ticketTitle) => {
    try {
        const info = await transporter.sendMail({
            from: '"Destek Sistemi" <no-reply@destek.com>',
            to: agentEmail,
            subject: "Yeni Bilet Atandı",
            text: `Merhaba, "${ticketTitle}" başlıklı bilet sizin üzerinize atanmıştır.`,
        });
        console.log("Atama E-postası gönderildi: %s", info.messageId);
        console.log("Önizleme URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Atama e-postası gönderilemedi:", error);
    }
};

// 4. Bilet Çözüldüğünde (RESOLVED) Kullanıcıya Gidecek E-posta[cite: 1]
const sendTicketResolvedEmail = async (userEmail, ticketTitle) => {
    try {
        const info = await transporter.sendMail({
            from: '"Destek Sistemi" <no-reply@destek.com>',
            to: userEmail,
            subject: "Biletiniz Çözüldü",
            text: `Merhaba, "${ticketTitle}" başlıklı biletiniz çözüme kavuşturulmuştur`,
        });
        console.log("Çözüldü E-postası gönderildi: %s", info.messageId);
        console.log("Önizleme URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Çözüldü e-postası gönderilemedi:", error);
    }
};

export { sendTicketCreatedEmail, sendTicketAssignedEmail, sendTicketResolvedEmail };