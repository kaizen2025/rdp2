/**
 * start-react.js - IMPROVED ROBUST VERSION
 * Starts React dev server with proper error handling and dependency checks
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const portsFilePath = path.join(__dirname, '.ports.json');
const reactPortFilePath = path.join(__dirname, '.react-port.json');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const reactScriptsPath = path.join(nodeModulesPath, '.bin', 'react-scripts');

const maxRetries = 20;
const retryDelay = 1000;
const compilationTimeout = 180000; // 3 minutes max for compilation

let currentAttempt = 0;
let compilationTimer = null;

/**
 * Clean up stale port files
 */
function cleanupStaleFiles() {
    if (fs.existsSync(reactPortFilePath)) {
        try {
            fs.unlinkSync(reactPortFilePath);
            console.log('[React Starter] 🧹 Cleaned up stale .react-port.json');
        } catch (err) {
            console.warn('[React Starter] ⚠️  Could not delete stale .react-port.json:', err.message);
        }
    }
}

/**
 * Verify dependencies are installed
 */
function checkDependencies() {
    console.log('[React Starter] 🔍 Checking dependencies...');

    if (!fs.existsSync(nodeModulesPath)) {
        console.error('[React Starter] ❌ ERROR: node_modules directory not found!');
        console.error('[React Starter] 📦 Please run: npm install');
        process.exit(1);
    }

    // Check if react-scripts exists
    const reactScriptsExists = fs.existsSync(reactScriptsPath) ||
                                fs.existsSync(reactScriptsPath + '.cmd') || // Windows
                                fs.existsSync(reactScriptsPath + '.ps1');   // Windows PowerShell

    if (!reactScriptsExists) {
        console.error('[React Starter] ❌ ERROR: react-scripts not found!');
        console.error('[React Starter] 📦 Please run: npm install');
        process.exit(1);
    }

    console.log('[React Starter] ✅ Dependencies check passed');
}

/**
 * Start React dev server
 */
function startReact(reactPort) {
    console.log(`[React Starter] 🚀 Starting React dev server on port ${reactPort}...`);

    // Verify dependencies before starting
    checkDependencies();

    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'react-scripts.cmd' : 'react-scripts';
    const args = ['start'];
    const options = {
        env: {
            ...process.env,
            PORT: reactPort.toString(),
            BROWSER: 'none',                    // Don't auto-open browser
            GENERATE_SOURCEMAP: 'true',
            ESLINT_NO_DEV_ERRORS: 'true',       // Don't fail on ESLint warnings
            TSC_COMPILE_ON_ERROR: 'true'        // Continue on TypeScript errors
        },
        shell: true
    };

    const child = spawn(command, args, options);
    let fullOutput = '';
    let portFileWritten = false;
    let compilationStarted = false;

    // Set a timeout for compilation
    compilationTimer = setTimeout(() => {
        if (!portFileWritten) {
            console.error('[React Starter] ⏱️  TIMEOUT: React compilation took too long (3 minutes)');
            console.error('[React Starter] 💡 Possible causes:');
            console.error('   - Syntax errors in code');
            console.error('   - Missing dependencies');
            console.error('   - Low system resources');
            child.kill('SIGTERM');
            process.exit(1);
        }
    }, compilationTimeout);

    child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[React Dev Server] ${output.trim()}`);

        fullOutput += output;

        // Detect compilation start
        if (!compilationStarted && (output.includes('Starting the development server') ||
                                     output.includes('Compiling...'))) {
            compilationStarted = true;
            console.log('[React Starter] 🔨 Compilation started...');
        }

        // Detect compilation success - multiple patterns for robustness
        const successPatterns = [
            'webpack compiled successfully',
            'Compiled successfully',
            'webpack compiled with',
            'You can now view'
        ];

        const isSuccess = successPatterns.some(pattern => fullOutput.includes(pattern));

        if (!portFileWritten && isSuccess) {
            clearTimeout(compilationTimer);
            console.log(`[React Starter] ✅ React server is ready on port ${reactPort}.`);

            // Write port file to signal readiness
            try {
                fs.writeFileSync(reactPortFilePath, JSON.stringify({
                    port: reactPort,
                    timestamp: new Date().toISOString()
                }));
                console.log(`[React Starter] ✅ Fichier .react-port.json créé avec port ${reactPort}`);
                portFileWritten = true;
            } catch (err) {
                console.error('[React Starter] ❌ Failed to write .react-port.json:', err.message);
            }
        }

        // Detect compilation errors
        if (output.includes('Failed to compile') ||
            output.includes('Compilation failed') ||
            output.includes('Module not found')) {
            console.error('[React Starter] ❌ Compilation failed - check the errors above');
        }
    });

    child.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`[React Dev Server ERROR] ${errorOutput.trim()}`);

        // Check for fatal errors
        if (errorOutput.includes('EADDRINUSE') ||
            errorOutput.includes('address already in use')) {
            console.error(`[React Starter] ❌ FATAL: Port ${reactPort} is already in use`);
            console.error('[React Starter] 💡 Kill the process using that port or change the port');
            clearTimeout(compilationTimer);
            process.exit(1);
        }
    });

    child.on('error', (error) => {
        console.error('[React Starter] ❌ Failed to start React process:', error.message);
        clearTimeout(compilationTimer);
        process.exit(1);
    });

    child.on('close', (code) => {
        clearTimeout(compilationTimer);
        console.log(`[React Starter] React dev server process exited with code ${code}.`);

        // Clean up the react port file on exit
        if (fs.existsSync(reactPortFilePath)) {
            try {
                fs.unlinkSync(reactPortFilePath);
                console.log('[React Starter] 🧹 Cleaned up .react-port.json');
            } catch (err) {
                console.warn('[React Starter] ⚠️  Could not delete .react-port.json:', err.message);
            }
        }

        process.exit(code);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('[React Starter] 🛑 Received SIGINT, shutting down gracefully...');
        clearTimeout(compilationTimer);
        child.kill('SIGTERM');
        setTimeout(() => {
            child.kill('SIGKILL');
            process.exit(0);
        }, 5000);
    });

    process.on('SIGTERM', () => {
        console.log('[React Starter] 🛑 Received SIGTERM, shutting down gracefully...');
        clearTimeout(compilationTimer);
        child.kill('SIGTERM');
    });
}

/**
 * Wait for .ports.json file from backend
 */
function waitForPortsFile() {
    if (fs.existsSync(portsFilePath)) {
        try {
            const portsContent = fs.readFileSync(portsFilePath, 'utf8');
            const ports = JSON.parse(portsContent);
            const reactPort = ports.react;

            if (!reactPort) {
                throw new Error('React port not found in .ports.json');
            }

            console.log(`[React Starter] ✅ Found React port ${reactPort} in .ports.json.`);

            // Clean up any stale files before starting
            cleanupStaleFiles();

            // Start React
            startReact(reactPort);

        } catch (error) {
            console.error(`[React Starter] ❌ Error reading .ports.json: ${error.message}`);
            console.error(`[React Starter] File content: ${fs.readFileSync(portsFilePath, 'utf8')}`);
            retryWait();
        }
    } else {
        console.log(`[React Starter] ⏳ Waiting for .ports.json... (Attempt ${currentAttempt + 1}/${maxRetries})`);
        retryWait();
    }
}

/**
 * Retry waiting for ports file
 */
function retryWait() {
    if (currentAttempt < maxRetries) {
        currentAttempt++;
        setTimeout(waitForPortsFile, retryDelay);
    } else {
        console.error('[React Starter] ❌ TIMEOUT: .ports.json was not created in time.');
        console.error('[React Starter] 💡 Make sure the backend server is running (npm run server:start)');
        process.exit(1);
    }
}

// Initial startup message
console.log('\n═══════════════════════════════════════════════════════');
console.log('   RDS Viewer - React Development Server Starter');
console.log('═══════════════════════════════════════════════════════\n');

// Start the process
waitForPortsFile();
