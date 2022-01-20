import * as core from "@actions/core";
import { Options, render, renderFile } from "ejs";
import { context } from "@actions/github";
import { exec } from "child_process";
import { join } from "path";

const renderOptions: Options & { async: false } = {
  outputFunctionName: "echo",
  async: false,
};

async function run(): Promise<void> {
  try {
    const template: string = core.getInput("template");
    const cmd: string = core.getInput("post-run");
    const templatePath: string = core.getInput("template-path");
    const _extInputs: string = core.getInput("ext-inputs");
    let extInputs: {};
    try {
      extInputs = JSON.parse(_extInputs);
    } catch {
      extInputs = { text: _extInputs };
    }

    let resultText: string;

    const renderContext = { context, require, extInputs };

    if (templatePath) {
      const fullPath = join(process.env.GITHUB_WORKSPACE || "", templatePath);
      resultText = await renderFile(fullPath, renderContext, renderOptions);
    } else {
      resultText = render(template, renderContext, renderOptions);
    }

    core.setOutput("content", resultText);
    if (cmd) {
      const cmdText = render(cmd, { output: resultText, context });
      exec(cmdText, function (error, stdout, stderr) {
        if (error) {
          console.error(`error: ${error}`);
          return;
        }
        core.info(stdout);
        core.error(stderr);
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
