/**
 * PowerShell Wrapper for executing PowerShell commands
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PowerShell {
    constructor() {
        this.defaultTimeout = 30000; // 30 seconds
    }

    /**
     * Execute a PowerShell command
     * @param {string} command - PowerShell command to execute
     * @param {object} options - Execution options
     * @returns {Promise<string>} - Command output
     */
    async execute(command, options = {}) {
        const timeout = options.timeout || this.defaultTimeout;

        try {
            // Check if running on Windows
            const isWindows = process.platform === 'win32';

            if (!isWindows) {
                console.warn('[PowerShell] Not running on Windows, command skipped:', command);
                return JSON.stringify({ error: 'PowerShell only available on Windows' });
            }

            // Execute PowerShell command with UTF-8 encoding
            const { stdout, stderr } = await execPromise(
                `powershell -NoProfile -NonInteractive -OutputFormat Text -Command "${command}"`,
                {
                    timeout,
                    encoding: 'utf8',
                    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
                }
            );

            if (stderr && stderr.trim()) {
                console.error('[PowerShell] Error output:', stderr);
            }

            return stdout;
        } catch (error) {
            console.error('[PowerShell] Execution error:', error.message);
            if (error.killed) {
                throw new Error(`PowerShell command timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Execute PowerShell command and parse JSON output
     * @param {string} command - PowerShell command that outputs JSON
     * @param {object} options - Execution options
     * @returns {Promise<object>} - Parsed JSON result
     */
    async executeJson(command, options = {}) {
        const output = await this.execute(command, options);

        try {
            return JSON.parse(output);
        } catch (error) {
            console.error('[PowerShell] Failed to parse JSON output:', output);
            throw new Error(`Failed to parse PowerShell JSON output: ${error.message}`);
        }
    }
}

module.exports = { PowerShell };
