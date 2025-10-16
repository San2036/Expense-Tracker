import { saveExpense } from '../../backend/config/azureBlob.js';
import { authenticateToken, createResponse } from '../shared/utils.js';

export default async function (context, req) {
  // Authenticate user
  const auth = authenticateToken(req);
  if (!auth.isAuthenticated) {
    return context.res = createResponse(401, { error: auth.error });
  }

  try {
    const blobName = await saveExpense(req.body, auth.user.userId);
    context.res = createResponse(200, { message: "Expense saved!", file: blobName });
  } catch (err) {
    context.res = createResponse(500, { error: err.message });
  }
}