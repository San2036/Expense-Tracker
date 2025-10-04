import express from "express";
import multer from "multer";
import { saveExpense, saveBill, listExpenses, getExpensesByDate, deleteExpense, updateExpense, saveFutureExpense, getFutureExpenses, getDueFutureExpenses, processDueFutureExpenses } from "../config/azureBlob.js";
import { authenticateToken } from "./authRoutes.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ➡️ Add normal expense
router.post("/", authenticateToken, async (req, res) => {
  try {
    const blobName = await saveExpense(req.body, req.user.userId);
    res.json({ message: "Expense saved!", file: blobName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📸 Upload bill (multiple files)
router.post("/upload-bill", authenticateToken, upload.array("billFiles", 10), async (req, res) => {
  try {
    const { supermarket, amount, date } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({ 
        error: `Invalid file types detected: ${invalidFiles.map(f => f.originalname).join(', ')}. Only images and PDF files are allowed.` 
      });
    }

    console.log(`📎 Uploading ${files.length} file(s) for bill`);
    
    const results = [];
    for (const file of files) {
      console.log(`📄 Processing file: ${file.originalname} (${file.mimetype})`);
      const blobName = await saveBill({ supermarket, amount, date }, file, req.user.userId);
      results.push({
        filename: file.originalname,
        blobName: blobName,
        type: file.mimetype
      });
    }
    
    res.json({ 
      message: `${files.length} file(s) uploaded successfully!`, 
      files: results,
      totalFiles: files.length
    });
  } catch (err) {
    console.error('🚫 Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📜 Get all expenses for authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const expenses = await listExpenses(req.user.userId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Export expenses by date range
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    console.log(`📊 Export request: ${startDate} to ${endDate} for user ${req.user.userId}`);
    
    // Get all expenses for the user
    const allExpenses = await listExpenses(req.user.userId);
    
    // Filter expenses by date range
    const filteredExpenses = allExpenses.filter(expense => {
      const expenseDate = expense.date.split('T')[0]; // Get YYYY-MM-DD
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    console.log(`📊 Found ${filteredExpenses.length} expenses for export`);
    
    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(filteredExpenses);
  } catch (err) {
    console.error('📊 Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update expense by ID
router.put("/update/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.userId;
    
    console.log(`✏️ Update request for expense ${id} by user ${userId}`);
    console.log('✏️ Update data:', updateData);
    
    const updatedExpense = await updateExpense(id, updateData, userId);
    
    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (err) {
    console.error('✏️ Update error:', err);
    
    if (err.message.includes('not found') || err.message.includes('permission')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// 📅 Schedule future expense
router.post("/future", authenticateToken, async (req, res) => {
  try {
    const futureExpenseData = req.body;
    const userId = req.user.userId;
    
    console.log(`📅 Creating future expense for user ${userId}:`, futureExpenseData);
    
    // Validate required fields
    if (!futureExpenseData.title || !futureExpenseData.amount || !futureExpenseData.scheduledDate) {
      return res.status(400).json({ error: 'Title, amount, and scheduled date are required' });
    }
    
    // Validate scheduled date is in the future for new expenses
    const scheduledDate = new Date(futureExpenseData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate < today) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }
    
    const futureExpense = await saveFutureExpense(futureExpenseData, userId);
    
    res.status(201).json({
      message: 'Future expense scheduled successfully',
      futureExpense
    });
  } catch (err) {
    console.error('📅 Future expense creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📅 Get all future expenses for user
router.get("/future", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const futureExpenses = await getFutureExpenses(userId);
    
    res.json(futureExpenses);
  } catch (err) {
    console.error('📅 Get future expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔔 Get due future expenses (for notifications)
router.get("/future/due", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query; // Optional date parameter
    const targetDate = date ? new Date(date) : new Date();
    
    const dueExpenses = await getDueFutureExpenses(targetDate);
    
    // Filter by user if not admin
    const userDueExpenses = dueExpenses.filter(expense => expense.userId === req.user.userId);
    
    res.json(userDueExpenses);
  } catch (err) {
    console.error('🔔 Get due expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📅 Process due future expenses (admin/system route)
router.post("/future/process", authenticateToken, async (req, res) => {
  try {
    // This could be restricted to admin users in production
    const processedExpenses = await processDueFutureExpenses();
    
    res.json({
      message: `Processed ${processedExpenses.length} due future expenses`,
      processedExpenses
    });
  } catch (err) {
    console.error('📅 Process future expenses error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📅 Get by date for authenticated user
router.get("/:date", authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const expenses = await getExpensesByDate(date, req.user.userId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Delete by date + id (authenticated users only)
router.delete("/:date/:id", authenticateToken, async (req, res) => {
  try {
    const { date, id } = req.params;
    console.log(`🗑️ Delete request: date=${date}, id=${id}, userId=${req.user.userId}`);
    
    const success = await deleteExpense(date, id);
    console.log(`🗑️ Delete result: ${success}`);
    
    if (success) {
      res.json({ message: "Expense deleted successfully!" });
    } else {
      res.status(404).json({ error: "Expense not found" });
    }
  } catch (err) {
    console.error("🗑️ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
