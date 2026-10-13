import { prisma } from "../config/db.js";
import { 
    sendTicketCreatedEmail, 
    sendTicketAssignedEmail, 
    sendTicketResolvedEmail 
} from "../utils/emailService.js";


// Bilet Oluşturma (POST /tickets)
const createTicket = async (req, res) => {
    const { title, description, priority } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: "Lütfen başlık ve açıklama girin" });
    }

    try {
        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                // Eğer body'den priority gelmezse şemadaki default değere (LOW) bırakması için:
                priority: priority || "LOW", 
                
                createdById: req.user.id 
            }
        });

 
        sendTicketCreatedEmail(req.user.email, ticket.title);

        return res.status(201).json({ status: "success", data: ticket });
    } catch (error) {
        console.error("Bilet oluşturma hatası:", error);
        return res.status(500).json({ message: "Bilet oluşturulurken bir hata oluştu" });
    }
};

// Biletleri Listeleme (GET /api/tickets)
const getTickets = async (req, res) => {
    try {
        // 1. Dinamik Filtre Oluşturma
        let queryFilter = {}; 
        
        // Eğer giriş yapan kişi standart bir kullanıcı (USER) ise, sadece kendi biletlerini görsün.
        // Eğer AGENT ise, filtre boş kalır ve Prisma sistemdeki tüm biletleri getirir.
        if (req.user.role === 'USER') {
            queryFilter = { createdById: req.user.id };
        }

        const tickets = await prisma.ticket.findMany({
            where: queryFilter,
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ status: "success", data: tickets });
    } catch (error) {
        console.error("Biletleri getirme hatası:", error);
        return res.status(500).json({ message: "Biletler getirilirken bir hata oluştu" });
    }
};


// Bilet Güncelleme (PUT /api/tickets/:id)
const updateTicket = async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { status, priority, description, assignedToId } = req.body;

    try {
        const existingTicket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!existingTicket) {
            return res.status(404).json({ message: "Güncellenecek bilet bulunamadı" });
        }

        // YETKİ KİLİDİ: Biletin sahibi değilse VE Temsilci (AGENT) değilse engelle
        if (existingTicket.createdById !== req.user.id && req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Bu bileti güncellemeye yetkiniz yok (403 Forbidden)" });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: status || existingTicket.status,
                priority: priority || existingTicket.priority,
                description: description || existingTicket.description,
                assignedToId: assignedToId !== undefined ? assignedToId : existingTicket.assignedToId
            }
        });

        // YAN ETKİ 1: Bilet durumu RESOLVED olduysa ve önceden RESOLVED değilse kullanıcıya mail at[cite: 1].
        if (updatedTicket.status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
            // Bileti oluşturan kullanıcının mailini veritabanından bulmamız gerekir (çünkü update'i yapan bir AGENT olabilir)
            const creator = await prisma.user.findUnique({ where: { id: updatedTicket.createdById } });
            if (creator) sendTicketResolvedEmail(creator.email, updatedTicket.title);
        }

        // YAN ETKİ 2: Bilete yeni bir temsilci atandıysa temsilciye mail at[cite: 1].
        if (updatedTicket.assignedToId && updatedTicket.assignedToId !== existingTicket.assignedToId) {
            // Atanan temsilcinin mailini bulalım
            const agent = await prisma.user.findUnique({ where: { id: updatedTicket.assignedToId } });
            if (agent) sendTicketAssignedEmail(agent.email, updatedTicket.title);
        }
        // YAN ETKİ 3: Socket.IO ile Gerçek Zamanlı Bildirim
        const io = req.app.get("io");
        
        // Bilet sahibine bildirim gönder
        io.to(`user_${updatedTicket.createdById}`).emit("ticket_updated", {
            ticketId: updatedTicket.id,
            status: updatedTicket.status,
            message: `Biletinizin durumu/önceliği güncellendi: ${updatedTicket.status}`
        });

        // Eğer bilet bir temsilciye atandıysa, ona da bildirim gönder
        if (updatedTicket.assignedToId) {
            io.to(`user_${updatedTicket.assignedToId}`).emit("ticket_updated", {
                ticketId: updatedTicket.id,
                status: updatedTicket.status,
                message: `İlgilendiğiniz bilet güncellendi: ${updatedTicket.status}`
            });
        }
        return res.status(200).json({ status: "success", data: updatedTicket });

    } catch (error) {
        console.error("Bilet güncelleme hatası:", error);
        return res.status(500).json({ message: "Bilet güncellenirken bir hata oluştu" });
    }
};

// Bilet Silme (DELETE /tickets/:id)
const deleteTicket = async (req, res) => {
    const ticketId = parseInt(req.params.id);

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Silinmek istenen bilet bulunamadı" });
        }

        // YETKİ KİLİDİ: Biletin sahibi değilse VE Temsilci (AGENT) değilse engelle!
        if (ticket.createdById !== req.user.id && req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Bu bileti silmeye yetkiniz yok (403 Forbidden)" });
        }

        await prisma.comment.deleteMany({
            where: { ticketId: ticketId }
        });

        await prisma.ticket.delete({
            where: { id: ticketId }
        });

        return res.status(200).json({ status: "success", message: "Bilet ve ona bağlı yorumlar başarıyla silindi" });

    } catch (error) {
        console.error("Bilet silme hatası:", error);
        return res.status(500).json({ message: "Bilet silinirken bir hata oluştu" });
    }
};

// Tek Bir Bileti Getirme (GET /tickets/:id)
const getTicketById = async (req, res) => {
    const ticketId = parseInt(req.params.id);

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                createdBy: { select: { id: true, email: true, role: true } },
                comments: true 
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Bilet bulunamadı" });
        }

        // YETKİ KONTROLÜ (AUTHORIZATION)
        // Eğer biletin sahibi isteği atan kişi DEĞİLSE "VE" bu kişi bir AGENT DEĞİLSE, reddet!
        if (ticket.createdById !== req.user.id && req.user.role !== 'AGENT') {
            return res.status(403).json({ message: "Bu bileti görüntüleme yetkiniz yok (403 Forbidden)" });
        }

        return res.status(200).json({ status: "success", data: ticket });
    } catch (error) {
        console.error("Bilet getirme hatası:", error);
        return res.status(500).json({ message: "Bilet getirilirken bir hata oluştu" });
    }
};

export { createTicket, getTickets, deleteTicket, updateTicket, getTicketById };