const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const portsFilePath = path.join(__dirname, '.ports.json');
const reactPortFilePath = path.join(__dirname, '.react-port.json');
const maxRetries = 20; // Increased retries for slower systems
const retryDelay = 1000; // Increased delay to 1 second

let currentAttempt = 0;

function startReact(reactPort) {
  console.log(`[React Starter] Attempting to start React dev server on port ${reactPort}...`);

  const command = 'react-scripts';
  const args = ['start'];
  const options = {
    env: { ...process.env, PORT: reactPort.toString() },
    shell: true // Use shell to handle command correctly on Windows
  };

  const child = spawn(command, args, options);
  let fullOutput = ''; // Accumuler l'output complet
  let portFileWritten = false;

  child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[React Dev Server] ${output}`);

    fullOutput += output;

    // Detect when React is ready - vérifier l'output accumulé
    if (!portFileWritten && (fullOutput.includes('webpack compiled successfully') || fullOutput.includes('Compiled successfully'))) {
      console.log(`[React Starter] ✅ React server is ready on port ${reactPort}.`);
      // Signal that React is ready by writing to a file
      fs.writeFileSync(reactPortFilePath, JSON.stringify({ port: reactPort }));
      console.log(`[React Starter] ✅ Fichier .react-port.json créé avec port ${reactPort}`);
      portFileWritten = true;
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`[React Dev Server ERROR] ${data.toString()}`);
  });

  child.on('close', (code) => {
    console.log(`[React Starter] React dev server process exited with code ${code}.`);
    // Clean up the react port file on exit
    if (fs.existsSync(reactPortFilePath)) {
      fs.unlinkSync(reactPortFilePath);
    }
  });
}

function waitForPortsFile() {
  if (fs.existsSync(portsFilePath)) {
    try {
      const ports = JSON.parse(fs.readFileSync(portsFilePath, 'utf8'));
      const reactPort = ports.react;

      if (!reactPort) {
        throw new Error('React port not found in .ports.json');
      }

      console.log(`[React Starter] Found React port ${reactPort} in .ports.json.`);
      startReact(reactPort);

    } catch (error) {
      console.error(`[React Starter] Error reading .ports.json: ${error.message}`);
      retryWait();
    }
  } else {
    console.log(`[React Starter] Waiting for .ports.json... (Attempt ${currentAttempt + 1}/${maxRetries})`);
    retryWait();
  }
}

function retryWait() {
  if (currentAttempt < maxRetries) {
    currentAttempt++;
    setTimeout(waitForPortsFile, retryDelay);
  } else {
    console.error('[React Starter] Max retries reached. .ports.json was not created in time.');
    process.exit(1);
  }
}

// Initial check
waitForPortsFile();
