const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const portsFilePath = path.join(__dirname, '.ports.json');
const maxRetries = 10;
const retryDelay = 500; // 0.5 seconds

let currentAttempt = 0;

function startReact() {
  try {
    const ports = JSON.parse(fs.readFileSync(portsFilePath, 'utf8'));
    const reactPort = ports.react;

    if (!reactPort) {
      throw new Error('React port not found in .ports.json');
    }

    console.log(`[React Starter] Found port ${reactPort}, starting dev server...`);

    const command = `cross-env PORT=${reactPort} react-scripts start`;
    const child = exec(command);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

  } catch (error) {
    console.error(`[React Starter] Failed to read port on attempt ${currentAttempt + 1}:`, error.message);
    if (currentAttempt < maxRetries) {
      currentAttempt++;
      setTimeout(waitForPortsFile, retryDelay);
    } else {
      console.error('[React Starter] Max retries reached. Could not start React server.');
      process.exit(1);
    }
  }
}

function waitForPortsFile() {
  if (fs.existsSync(portsFilePath)) {
    console.log('[React Starter] .ports.json detected. Proceeding to start React.');
    startReact();
  } else {
    if (currentAttempt < maxRetries) {
      console.log(`[React Starter] Waiting for .ports.json... (Attempt ${currentAttempt + 1}/${maxRetries})`);
      currentAttempt++;
      setTimeout(waitForPortsFile, retryDelay);
    } else {
      console.error('[React Starter] Max retries reached. .ports.json was not created in time.');
      process.exit(1);
    }
  }
}

// Initial check
waitForPortsFile();
