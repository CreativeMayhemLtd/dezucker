import { storageFactory } from "../../src/storage/types";
import { unlinkSync, existsSync } from "fs";

const TEST_DB = "../../../data/test-storage.json";

// Helper to cleanup test DB
function cleanup() {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }
}

async function runVerification() {
  console.log("Starting Storage Update Verification...");

  // 1. Initialize storage
  const storage = await storageFactory();
  
  const testName = "Test Person " + Date.now();
  
  // 2. Perform an update
  console.log(`Adding ${testName} to people collection...`);
  await storage.update("people", (people) => {
    people.push({ name: testName, verified: true });
  });

  // 3. Read back to verify
  const people = await storage.dataFor("people");
  const found = people.find(p => p.name === testName);

  if (found && found.verified) {
    console.log("✅ Verification Successful: Record found and persisted.");
  } else {
    console.error("❌ Verification Failed: Record not found or data mismatch.");
    process.exit(1);
  }

  // 4. Test nested update/mutation
  console.log("Updating record...");
  await storage.update("people", (people) => {
    const p = people.find(person => person.name === testName);
    if (p) p.updated = true;
  });

  const peopleAfterUpdate = await storage.dataFor("people");
  const updatedPerson = peopleAfterUpdate.find(p => p.name === testName);

  if (updatedPerson && updatedPerson.updated === true) {
    console.log("✅ Verification Successful: Record updated correctly.");
  } else {
    console.error("❌ Verification Failed: Record not updated.");
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
