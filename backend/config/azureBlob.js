import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { User } from "../models/User.js";

// ⚠️ Load from .env in production
const AZURE_STORAGE_CONNECTION_STRING ="DefaultEndpointsProtocol=https;AccountName=sudharsan;AccountKey=cXQM+M1wosutbjPzLhqn8xesOyyTcV5kiz6BJSHvEgsl8qqTkmle9NR14OE6zMUAJvAR6zwIlOeX+AStUc92tw==;EndpointSuffix=core.windows.net"

const CONTAINER_NAME ="sudharsan";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("❌ Azure connection string missing. Check .env file!");
}

let containerClient;

// ✅ Initialize Azure Blob
export const initAzure = async () => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists({ access: "container" });
    console.log(`✅ Azure Blob Container ready: ${CONTAINER_NAME}`);
  } catch (err) {
    console.error("❌ Azure Blob Error:", err.message);
    process.exit(1);
  }
};

// ✅ Helper: Format IST datetime string
function toISTISOString(date = new Date()) {
  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(date);

  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;
  const second = parts.find((p) => p.type === "second").value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
}

// ✅ Save normal expense
export const saveExpense = async (expense, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!expense.date || isNaN(Date.parse(expense.date))) {
    expense.date = toISTISOString();
  } else {
    expense.date = toISTISOString(new Date(expense.date));
  }

  const dateStr = expense.date.split("T")[0];
  const blobName = `expenses-${dateStr}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  let existing = [];
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    existing = JSON.parse(content);
  } catch (err) {
    existing = [];
  }

  // Add unique ID and user association
  const expenseWithId = { id: uuidv4(), userId, ...expense };
  existing.push(expenseWithId);

  const data = JSON.stringify(existing, null, 2);
  await blockBlobClient.upload(data, Buffer.byteLength(data), {
    overwrite: true,
  });

  return blobName;
};

// ✅ Save bill (image + supermarket + amount)
export const saveBill = async (bill, file, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!bill.date || isNaN(Date.parse(bill.date))) {
    bill.date = toISTISOString();
  } else {
    bill.date = toISTISOString(new Date(bill.date));
  }

  const dateStr = bill.date.split("T")[0];
  const blobName = `expenses-${dateStr}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file separately (image or PDF)
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  const fileExtension = file.originalname.split('.').pop();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  const fileBlobName = `bills/${dateStr}-${timestamp}-${randomId}-${sanitizedName}`;
  const fileBlobClient = containerClient.getBlockBlobClient(fileBlobName);
  
  console.log(`📄 Uploading file: ${file.originalname} as ${fileBlobName}`);
  console.log(`📋 File type: ${file.mimetype}, Size: ${file.size} bytes`);

  await fileBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { 
      blobContentType: file.mimetype,
      blobContentDisposition: `inline; filename="${file.originalname}"`
    },
  });

  const fileUrl = fileBlobClient.url;

  const billEntry = {
    id: uuidv4(),
    userId,
    supermarket: bill.supermarket,
    amount: bill.amount,
    date: bill.date,
    fileUrl: fileUrl,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    isImage: file.mimetype.startsWith('image/'),
    isPDF: file.mimetype === 'application/pdf',
    // Keep imageUrl for backward compatibility
    imageUrl: fileUrl,
  };

  let existing = [];
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    existing = JSON.parse(content);
  } catch (err) {
    existing = [];
  }

  existing.push(billEntry);

  const data = JSON.stringify(existing, null, 2);
  await blockBlobClient.upload(data, Buffer.byteLength(data), {
    overwrite: true,
  });

  return blobName;
};

// ✅ List all expenses for a specific user
export const listExpenses = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const expenses = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.startsWith("expenses-")) continue; // skip non-expense blobs
    const blobClient = containerClient.getBlobClient(blob.name);
    const downloadResponse = await blobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    try {
      const arr = JSON.parse(content);
      // Filter expenses by user ID
      const userExpenses = arr.filter(expense => expense.userId === userId);
      expenses.push(...userExpenses);
    } catch (err) {
      console.warn("Skipping invalid blob:", blob.name);
    }
  }
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`📋 Returning ${expenses.length} expenses for user ${userId}`);
  if (expenses.length > 0) {
    console.log(`🔍 Sample expense:`, expenses[0]);
  }
  return expenses;
};

// ✅ Get expenses by specific date for a user
export const getExpensesByDate = async (dateStr, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const blobName = `expenses-${dateStr}.json`;
  const blobClient = containerClient.getBlockBlobClient(blobName);

  try {
    const downloadResponse = await blobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    const allExpenses = JSON.parse(content);
    // Filter expenses by user ID
    return allExpenses.filter(expense => expense.userId === userId);
  } catch (err) {
    return [];
  }
};

// ✏️ Update expense by ID
// ✅ Save future/scheduled expense
export const saveFutureExpense = async (futureExpenseData, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const blobName = 'future-expenses.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  let existing = [];
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    existing = JSON.parse(content);
  } catch (err) {
    existing = [];
  }

  // Create future expense with unique ID
  const futureExpense = {
    id: uuidv4(),
    userId,
    ...futureExpenseData,
    createdAt: new Date().toISOString(),
    status: 'scheduled' // scheduled, completed, cancelled
  };
  
  existing.push(futureExpense);
  
  const data = JSON.stringify(existing, null, 2);
  await blockBlobClient.upload(data, Buffer.byteLength(data), {
    overwrite: true,
  });
  
  console.log(`📅 Saved future expense: ${futureExpense.title} for ${futureExpense.scheduledDate}`);
  return futureExpense;
};

// ✅ Get all future expenses for a user
export const getFutureExpenses = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const blobName = 'future-expenses.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    const allFutureExpenses = JSON.parse(content);
    
    // Filter by user and sort by scheduled date
    const userFutureExpenses = allFutureExpenses
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    return userFutureExpenses;
  } catch (err) {
    return [];
  }
};

// ✅ Get due future expenses (for notifications)
export const getDueFutureExpenses = async (targetDate = new Date()) => {
  const blobName = 'future-expenses.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    const allFutureExpenses = JSON.parse(content);
    
    const todayStr = targetDate.toISOString().split('T')[0];
    
    // Find expenses due today
    const dueExpenses = allFutureExpenses.filter(expense => {
      if (expense.status !== 'scheduled') return false;
      
      const scheduledDateStr = expense.scheduledDate.split('T')[0];
      return scheduledDateStr <= todayStr;
    });
    
    return dueExpenses;
  } catch (err) {
    console.error('Error fetching due expenses:', err);
    return [];
  }
};

// ✅ Process due future expenses (convert to actual expenses)
export const processDueFutureExpenses = async () => {
  const dueExpenses = await getDueFutureExpenses();
  const processedExpenses = [];
  
  for (const futureExpense of dueExpenses) {
    try {
      // Create actual expense from future expense
      const expenseData = {
        title: futureExpense.title,
        amount: futureExpense.amount,
        category: futureExpense.category,
        date: futureExpense.scheduledDate,
        isFromFutureExpense: true,
        originalFutureExpenseId: futureExpense.id
      };
      
      // Save as regular expense
      await saveExpense(expenseData, futureExpense.userId);
      
      // Handle recurring expenses
      if (futureExpense.isRecurring && futureExpense.recurrence) {
        const nextDate = calculateNextRecurrenceDate(
          futureExpense.scheduledDate,
          futureExpense.recurrence
        );
        
        if (nextDate) {
          // Update future expense with next scheduled date
          await updateFutureExpenseDate(futureExpense.id, nextDate);
        } else {
          // Mark as completed if no more recurrences
          await updateFutureExpenseStatus(futureExpense.id, 'completed');
        }
      } else {
        // Mark one-time future expense as completed
        await updateFutureExpenseStatus(futureExpense.id, 'completed');
      }
      
      processedExpenses.push({
        futureExpenseId: futureExpense.id,
        createdExpense: expenseData,
        userId: futureExpense.userId
      });
      
    } catch (err) {
      console.error(`Error processing future expense ${futureExpense.id}:`, err);
    }
  }
  
  console.log(`📅 Processed ${processedExpenses.length} due future expenses`);
  return processedExpenses;
};

// ✅ Calculate next recurrence date
const calculateNextRecurrenceDate = (currentDate, recurrence) => {
  const date = new Date(currentDate);
  
  switch (recurrence.type) {
    case 'daily':
      date.setDate(date.getDate() + recurrence.interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (recurrence.interval * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + recurrence.interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + recurrence.interval);
      break;
    default:
      return null;
  }
  
  // Check if end date is specified
  if (recurrence.endDate && date > new Date(recurrence.endDate)) {
    return null;
  }
  
  // Check if max occurrences reached
  if (recurrence.maxOccurrences && recurrence.currentOccurrence >= recurrence.maxOccurrences) {
    return null;
  }
  
  return date.toISOString();
};

// ✅ Update future expense status
const updateFutureExpenseStatus = async (futureExpenseId, newStatus) => {
  const blobName = 'future-expenses.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    let futureExpenses = JSON.parse(content);
    
    // Find and update the future expense
    const expenseIndex = futureExpenses.findIndex(exp => exp.id === futureExpenseId);
    if (expenseIndex !== -1) {
      futureExpenses[expenseIndex].status = newStatus;
      futureExpenses[expenseIndex].updatedAt = new Date().toISOString();
      
      const data = JSON.stringify(futureExpenses, null, 2);
      await blockBlobClient.upload(data, Buffer.byteLength(data), {
        overwrite: true,
      });
    }
  } catch (err) {
    console.error('Error updating future expense status:', err);
  }
};

// ✅ Update future expense date (for recurring)
const updateFutureExpenseDate = async (futureExpenseId, newDate) => {
  const blobName = 'future-expenses.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    let futureExpenses = JSON.parse(content);
    
    // Find and update the future expense
    const expenseIndex = futureExpenses.findIndex(exp => exp.id === futureExpenseId);
    if (expenseIndex !== -1) {
      futureExpenses[expenseIndex].scheduledDate = newDate;
      futureExpenses[expenseIndex].updatedAt = new Date().toISOString();
      
      // Increment occurrence counter for recurring expenses
      if (futureExpenses[expenseIndex].recurrence && futureExpenses[expenseIndex].recurrence.currentOccurrence) {
        futureExpenses[expenseIndex].recurrence.currentOccurrence++;
      }
      
      const data = JSON.stringify(futureExpenses, null, 2);
      await blockBlobClient.upload(data, Buffer.byteLength(data), {
        overwrite: true,
      });
    }
  } catch (err) {
    console.error('Error updating future expense date:', err);
  }
};

// ✏️ Update expense by ID
export const updateExpense = async (expenseId, updateData, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!expenseId) {
    throw new Error('Expense ID is required');
  }
  
  console.log(`✏️ Updating expense ${expenseId} for user ${userId}`);
  
  // Get all expenses for the user to find the one to update
  const allExpenses = await listExpenses(userId);
  const expenseToUpdate = allExpenses.find(exp => exp.id === expenseId);
  
  if (!expenseToUpdate) {
    throw new Error('Expense not found or you do not have permission to edit it');
  }
  
  // Create updated expense object
  const updatedExpense = {
    ...expenseToUpdate,
    ...updateData,
    id: expenseToUpdate.id, // Preserve original ID
    userId: expenseToUpdate.userId, // Preserve original user ID
    // Preserve file-related fields if not being updated
    imageUrl: updateData.imageUrl !== undefined ? updateData.imageUrl : expenseToUpdate.imageUrl,
    fileUrl: updateData.fileUrl !== undefined ? updateData.fileUrl : expenseToUpdate.fileUrl,
    fileName: updateData.fileName !== undefined ? updateData.fileName : expenseToUpdate.fileName,
    fileType: updateData.fileType !== undefined ? updateData.fileType : expenseToUpdate.fileType,
    fileSize: updateData.fileSize !== undefined ? updateData.fileSize : expenseToUpdate.fileSize,
    isImage: updateData.isImage !== undefined ? updateData.isImage : expenseToUpdate.isImage,
    isPDF: updateData.isPDF !== undefined ? updateData.isPDF : expenseToUpdate.isPDF,
  };
  
  // Find which date file this expense belongs to
  const expenseDate = expenseToUpdate.date.split('T')[0];
  const blobName = `expenses-${expenseDate}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  // Get current expenses from the file
  let existingExpenses = [];
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    existingExpenses = JSON.parse(content);
  } catch (err) {
    throw new Error('Failed to read expense data');
  }
  
  // Find and update the expense in the array
  const expenseIndex = existingExpenses.findIndex(exp => exp.id === expenseId);
  if (expenseIndex === -1) {
    throw new Error('Expense not found in storage');
  }
  
  existingExpenses[expenseIndex] = updatedExpense;
  
  // Save the updated expenses back to storage
  const data = JSON.stringify(existingExpenses, null, 2);
  await blockBlobClient.upload(data, Buffer.byteLength(data), {
    overwrite: true,
  });
  
  console.log(`✅ Successfully updated expense ${expenseId}`);
  
  return updatedExpense;
};

// ✅ Delete expense by ID
export const deleteExpense = async (dateStr, id) => {
  console.log(`🔍 Delete request: dateStr=${dateStr}, id=${id}`);
  
  // Try to find the expense in the specified date file first
  let blobName = `expenses-${dateStr}.json`;
  let blobClient = containerClient.getBlockBlobClient(blobName);
  let expenses = [];
  let foundExpense = null;
  let foundBlobName = null;

  try {
    console.log(`🔍 Looking for blob: ${blobName}`);
    const downloadResponse = await blobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    expenses = JSON.parse(content);
    
    console.log(`📋 Found ${expenses.length} expenses in ${blobName}`);
    console.log(`🎯 Looking for ID: ${id}`);
    console.log(`📝 Available IDs: ${expenses.map(e => e.id).join(', ')}`);

    foundExpense = expenses.find((e) => e.id === id);
    if (foundExpense) {
      foundBlobName = blobName;
      console.log(`✅ Found expense with ID ${id} in ${blobName}`);
    }
  } catch (err) {
    console.log(`⚠️ Blob ${blobName} not found, searching all expense files...`);
  }

  // If not found in the specified date, search all expense files
  if (!foundExpense) {
    console.log(`🔍 Searching all expense files for ID: ${id}`);
    
    for await (const blob of containerClient.listBlobsFlat()) {
      if (!blob.name.startsWith("expenses-")) continue;
      
      try {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await streamToString(downloadResponse.readableStreamBody);
        const allExpenses = JSON.parse(content);
        
        const expense = allExpenses.find((e) => e.id === id);
        if (expense) {
          console.log(`✅ Found expense with ID ${id} in ${blob.name}`);
          foundExpense = expense;
          foundBlobName = blob.name;
          expenses = allExpenses;
          blobClient = containerClient.getBlockBlobClient(blob.name);
          break;
        }
      } catch (err) {
        console.log(`⚠️ Error reading ${blob.name}:`, err.message);
      }
    }
  }

  if (!foundExpense) {
    console.log(`❌ Expense with ID ${id} not found in any file`);
    return false;
  }

  try {
    // Remove entry
    expenses = expenses.filter((e) => e.id !== id);
    console.log(`🗑️ Removing expense with ID ${id} from ${foundBlobName}`);

    // Delete bill file if present (supports both old imageUrl and new fileUrl)
    const fileUrl = foundExpense.fileUrl || foundExpense.imageUrl;
    if (fileUrl) {
      try {
        const fileName = fileUrl.split("/").pop();
        const fileClient = containerClient.getBlockBlobClient(`bills/${fileName}`);
        await fileClient.deleteIfExists();
        console.log(`🗑️ Deleted file: ${fileName}`);
      } catch (err) {
        console.log(`⚠️ Failed to delete file: ${err.message}`);
      }
    }

    // Update JSON file
    const data = JSON.stringify(expenses, null, 2);
    await blobClient.upload(data, Buffer.byteLength(data), { overwrite: true });
    console.log(`✅ Updated ${foundBlobName} with ${expenses.length} remaining expenses`);

    return true;
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    return false;
  }
};

// ✅ Helper: Stream to String
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// ========== USER MANAGEMENT FUNCTIONS ==========

// ✅ Save user to Azure Blob Storage
export const saveUser = async (userData) => {
  const blobName = 'users.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  let existing = [];
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    existing = JSON.parse(content);
  } catch (err) {
    existing = [];
  }

  // Check if user already exists
  const existingUser = existing.find(user => user.email === userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create new user with hashed password
  const newUser = new User({ ...userData, id: uuidv4() });
  await newUser.hashPassword();
  
  // Convert to plain object to ensure proper serialization
  const userToSave = {
    id: newUser.id,
    email: newUser.email,
    password: newUser.password, // This is the hashed password
    name: newUser.name,
    createdAt: newUser.createdAt
  };
  
  existing.push(userToSave);
  
  const data = JSON.stringify(existing, null, 2);
  await blockBlobClient.upload(data, Buffer.byteLength(data), {
    overwrite: true,
  });
  
  return newUser.toJSON(); // Return user without password
};

// ✅ Find user by email
export const findUserByEmail = async (email) => {
  const blobName = 'users.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    const users = JSON.parse(content);
    
    console.log(`🔍 Looking for user with email: ${email}`);
    console.log(`📋 Total users in storage: ${users.length}`);
    
    const userData = users.find(user => user.email === email);
    if (!userData) {
      console.log(`❌ User not found with email: ${email}`);
      return null;
    }
    
    console.log(`✅ Found user data:`, {
      id: userData.id,
      email: userData.email,
      hasPassword: !!userData.password,
      passwordLength: userData.password ? userData.password.length : 0,
      name: userData.name
    });
    
    // Create User instance with all properties preserved
    const user = new User({
      id: userData.id,
      email: userData.email,
      password: userData.password, // Explicitly pass the hashed password
      name: userData.name,
      createdAt: userData.createdAt
    });
    
    // Double-check that password is set correctly
    if (!user.password && userData.password) {
      console.log('⚠️ Password not set properly, fixing...');
      user.password = userData.password;
    }
    
    console.log(`🔐 User instance created with password:`, !!user.password);
    return user;
  } catch (err) {
    console.error('❌ Error finding user by email:', err);
    return null;
  }
};

// ✅ Find user by ID
export const findUserById = async (id) => {
  const blobName = 'users.json';
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  try {
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    const users = JSON.parse(content);
    
    const userData = users.find(user => user.id === id);
    if (!userData) return null;
    
    // Create User instance with all properties preserved
    const user = new User(userData);
    // Ensure password is preserved for comparison (though not needed for /me endpoint)
    user.password = userData.password;
    return user;
  } catch (err) {
    console.error('Error finding user by ID:', err);
    return null;
  }
};
