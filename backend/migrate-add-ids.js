import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

// ⚠️ Load from .env in production
const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=sudharsan;AccountKey=cXQM+M1wosutbjPzLhqn8xesOyyTcV5kiz6BJSHvEgsl8qqTkmle9NR14OE6zMUAJvAR6zwIlOeX+AStUc92tw==;EndpointSuffix=core.windows.net";

const CONTAINER_NAME = "sudharsan";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("❌ Azure connection string missing. Check .env file!");
}

let containerClient;

// ✅ Initialize Azure Blob
const initAzure = async () => {
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

// Helper: Stream to String
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// Migration function
const migrateAddIds = async () => {
  console.log("🔄 Starting ID migration...");
  
  let totalUpdated = 0;
  
  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.startsWith("expenses-")) continue;
    
    console.log(`📝 Processing ${blob.name}...`);
    
    const blobClient = containerClient.getBlockBlobClient(blob.name);
    
    try {
      const downloadResponse = await blobClient.download();
      const content = await streamToString(downloadResponse.readableStreamBody);
      let expenses = JSON.parse(content);
      
      let updated = false;
      
      // Add IDs to expenses that don't have them
      expenses = expenses.map(expense => {
        if (!expense.id) {
          console.log(`  ➕ Adding ID to expense: ${expense.title || expense.supermarket}`);
          updated = true;
          return { id: uuidv4(), ...expense };
        }
        return expense;
      });
      
      if (updated) {
        // Upload the updated data
        const data = JSON.stringify(expenses, null, 2);
        await blobClient.upload(data, Buffer.byteLength(data), { overwrite: true });
        console.log(`  ✅ Updated ${blob.name} with ${expenses.length} expenses`);
        totalUpdated++;
      } else {
        console.log(`  ℹ️ No updates needed for ${blob.name}`);
      }
      
    } catch (err) {
      console.error(`  ❌ Error processing ${blob.name}:`, err.message);
    }
  }
  
  console.log(`🎉 Migration complete! Updated ${totalUpdated} files.`);
};

// Run migration
const run = async () => {
  await initAzure();
  await migrateAddIds();
  process.exit(0);
};

run().catch(console.error);