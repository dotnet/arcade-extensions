import tl = require('azure-pipelines-task-lib/task');
import trm = require('azure-pipelines-task-lib/toolrunner');

async function run() {
    try {
        let tool: trm.ToolRunner;
        let agentOS = process.env["AGENT_OS"];
        if (agentOS === 'Windows_NT') {
            console.log("Windows... using CMD");
            let scriptPath = process.env["INPUTCMD"] || null;
            if (null === scriptPath) {
                throw "Missing path to CMD script";
            }
            let cmdPath = tl.which('cmd');
            tool = tl.tool(cmdPath).arg('/c').arg(scriptPath);
        } else if (agentOS === 'Linux' || agentOS === 'Darwin') {
            console.log("macOS/Linux... using Bash");
            let scriptPath = process.env["INPUTBASH"] || null;
            if (null === scriptPath) {
                throw "Missing path to Bash script";
            }
            let bashPath = tl.which('bash');
            tool = tl.tool(bashPath).arg(scriptPath);
        } else {
            throw "Unsupported platform: " + agentOS;
        }

        let result = await tool.exec();
        return result;
    } catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        } else {
            tl.setResult(tl.TaskResult.Failed, "Unknown Error");
        }
    }
}

run();