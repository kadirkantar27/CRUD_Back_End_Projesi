import { prisma } from "../config/db.js";

// Yorum Ekleme (POST /api/tickets/:id/comments)
const addComment = async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Lütfen yorum içeriğini girin" });
    }

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Bilet bulunamadı" });
        }

        // YETKİ KİLİDİ: Başkasının biletine (eğer AGENT değilse) yorum yapamasın!
        if (ticket.createdById !== req.user.id && req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Bu bilete yorum yapma yetkiniz yok" });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                ticketId,
                authorId: req.user.id
            }
        });

        // EKLENECEK YENİ KOD: Socket.IO ile Bildirim Fırlatma
        // Sadece bu biletin sahibine (ve varsa atanan temsilciye) bildirimi gönder
        const io = req.app.get("io");
        io.to(`user_${ticket.createdById}`).emit("new_comment", {
            ticketId: ticketId,
            content: content,
            message: "Biletinize yeni bir yorum yapıldı!"
        });
        // EĞER TEMSİLCİ ATANMIŞSA ONA DA GÖNDER
        if (ticket.assignedToId) {
             io.to(`user_${ticket.assignedToId}`).emit("new_comment", {
                ticketId: ticketId,
                content: content,
                message: "İlgilendiğiniz bilete yeni bir yorum yapıldı!"
            });
        }

        return res.status(201).json({ status: "success", data: comment });
    } catch (error) {
        console.error("Yorum ekleme hatası:", error);
        return res.status(500).json({ message: "Yorum eklenirken bir hata oluştu" });
    }
};

// Bir Biletin Yorumlarını Listeleme (GET /api/tickets/:id/comments)
const getComments = async (req, res) => {
    const ticketId = parseInt(req.params.id);

    try {
        // Önce bileti bulmamız lazım ki sahibini kontrol edebilelim
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Bilet bulunamadı" });
        }

        // YETKİ KİLİDİ: Başkasının biletindeki yorumları (eğer AGENT değilse) okuyamasın!
        if (ticket.createdById !== req.user.id && req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Bu biletin yorumlarını görme yetkiniz yok" });
        }

        // Yetki varsa yorumları getir
        const comments = await prisma.comment.findMany({
            where: { ticketId: ticketId },
            orderBy: { createdAt: "asc" }
        });

        return res.status(200).json({ status: "success", data: comments });
    } catch (error) {
        console.error("Yorumları getirme hatası:", error);
        return res.status(500).json({ message: "Yorumlar getirilirken bir hata oluştu" });
    }
};

export { addComment, getComments };