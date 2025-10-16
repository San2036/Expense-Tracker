import { saveBill } from '../../backend/config/azureBlob.js';
import { authenticateToken, createResponse } from '../shared/utils.js';
import multipart from 'parse-multipart-data';

export default async function (context, req) {
  // Authenticate user
  const auth = authenticateToken(req);
  if (!auth.isAuthenticated) {
    return context.res = createResponse(401, { error: auth.error });
  }

  try {
    // Parse multipart form data
    const bodyBuffer = Buffer.from(req.body);
    const boundary = multipart.getBoundary(req.headers['content-type']);
    const parts = multipart.parse(bodyBuffer, boundary);
    
    if (!parts || parts.length === 0) {
      return context.res = createResponse(400, { error: "No files uploaded" });
    }
    
    // Extract form fields
    const formData = {};
    const files = [];
    
    for (const part of parts) {
      if (part.filename) {
        // This is a file
        files.push({
          originalname: part.filename,
          buffer: part.data,
          mimetype: part.type
        });
      } else {
        // This is a form field
        formData[part.name] = part.data.toString();
      }
    }
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return context.res = createResponse(400, { 
        error: `Invalid file types detected: ${invalidFiles.map(f => f.originalname).join(', ')}. Only images and PDF files are allowed.` 
      });
    }
    
    const results = [];
    for (const file of files) {
      const blobName = await saveBill(formData, file, auth.user.userId);
      results.push({
        filename: file.originalname,
        blobName: blobName,
        type: file.mimetype
      });
    }
    
    context.res = createResponse(200, { 
      message: `Successfully uploaded ${results.length} file(s)`,
      files: results
    });
  } catch (err) {
    context.res = createResponse(500, { error: err.message });
  }
}