import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runAllTests() {
  console.log("🚀 Running integration tests...");
  
  const files = readdirSync(__dirname);
  const testFiles = files.filter(f => f !== "index.ts" && (f.endsWith(".ts") || f.endsWith(".js")));

  let failed = false;

  for (const file of testFiles) {
    console.log(`\n--- Running ${file} ---`);
    try {
      // Use Bun.spawn to run each test file as a separate process to ensure isolation
      const proc = Bun.spawn(["bun", join(__dirname, file)], {
        stdout: "inherit",
        stderr: "inherit",
      });
      
      const exitCode = await proc.exited;
      
      if (exitCode !== 0) {
        console.error(`❌ ${file} failed with exit code ${exitCode}`);
        failed = true;
      } else {
        console.log(`✅ ${file} passed`);
      }
    } catch (err) {
      console.error(`💥 Error running ${file}:`, err);
      failed = true;
    }
  }

  if (failed) {
    console.log("\n❌ Some integration tests failed.");
    process.exit(1);
  } else {
    console.log("\n✨ All integration tests passed!");
  }
}

runAllTests().catch(err => {
  console.error("Fatal error in test runner:", err);
  process.exit(1);
});
