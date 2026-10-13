import express from "express";
import { createTicket, getTickets, deleteTicket, updateTicket, getTicketById } from "../controllers/ticketController.js";
import { addComment, getComments } from "../controllers/commentController.js"; // Yeni kontrolcümüzü içe aktardık
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Bilet (Ticket) Rotaları
router.post("/", protect, createTicket);
router.get("/", protect, getTickets);
router.delete("/:id", protect, deleteTicket);
router.put("/:id", protect, updateTicket);
router.get("/:id", protect, getTicketById);

// Yorum (Comment) Rotaları
// :id parametresi biletin benzersiz ID'sini temsil eder
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);


export default router;