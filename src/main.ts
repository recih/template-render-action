import * as core from "@actions/core";
import * as path from "path";
import { resolve } from "path";
import * as YAML from "yaml";
import { context } from "@actions/github";
import * as glob from "@actions/glob";
import { promises as fsPromises } from "fs";
import * as ejsRender from "./renderer/ejs";
import * as mustacheRender from "./renderer/mustache";
import * as process from "process";

type Renderer = {
  render(template: string, data: object, options?: object): Promise<string>;
  renderFile(file: string, data: object, options?: object): Promise<string>;
};

const renderers: { [key: string]: Renderer } = {
  ejs: ejsRender,
  mustache: mustacheRender,
};

async function loadVars(file: string): Promise<{}> {
  const ext = path.extname(file);
  switch (ext) {
    case ".json": {
      const content = await fsPromises.readFile(file, "utf8");
      return JSON.parse(content);
    }
    case ".yml":
    case ".yaml": {
      const content = await fsPromises.readFile(file, "utf8");
      return YAML.parse(content);
    }
    default:
      throw new Error(`Unsupported vars file extension: ${ext}`);
  }
}

async function getVarsInput(): Promise<{}> {
  const vars: string = core.getInput("vars");
  if (vars) {
    try {
      return JSON.parse(vars);
    } catch {
      return await loadVars(vars);
    }
  } else {
    return {};
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function resolvePath(filePath: string): string {
  return resolve(process.env.GITHUB_WORKSPACE || "", filePath);
}

async function render(
  renderer: Renderer,
  data: object,
  templateFile?: string,
  template?: string,
  options?: object,
): Promise<string> {
  if (templateFile) {
    const fullPath = resolvePath(templateFile);
    if (!(await fileExists(fullPath))) {
      throw new Error(`Template file not found: ${fullPath}`);
    }
    return renderer.renderFile(fullPath, data, options);
  } else if (template) {
    return renderer.render(template, data, options);
  } else {
    throw new Error("No template or template file specified");
  }
}

async function renderFile(
  renderer: Renderer,
  inputFile: string,
  outputFile: string,
  data: object,
  options?: object,
): Promise<void> {
  const output = await render(renderer, data, inputFile, undefined, options);
  const outputFullPath = resolvePath(outputFile);
  await fsPromises.writeFile(outputFullPath, output, "utf8");
}

async function run(): Promise<void> {
  try {
    const template: string = core.getInput("template");
    const templateFile: string = core.getInput("template-file");
    if (!template && !templateFile) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error("No template specified, please provide `template` or `template-file`");
    }
    const globMode: boolean = core.getBooleanInput("glob");
    if (globMode && !templateFile) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error("Glob mode is enabled, please provide `template-file` as a glob pattern.");
    }
    const engine: string = core.getInput("engine");
    const renderer = renderers[engine];
    if (!renderer) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`Unsupported template engine: ${engine}`);
    }
    const outputFile: string = core.getInput("output-file");
    const vars = await getVarsInput();

    const env = process.env;
    const renderContext = { context, env, ...vars };

    if (globMode) {
      const globber = await glob.create(templateFile);
      for await (const file of globber.globGenerator()) {
        const destFile = file.replace(/\.[^.]+$/, "");
        core.debug(`Rendering ${file} to ${destFile}`);
        await renderFile(renderer, file, destFile, renderContext);
      }
      return;
    }

    const resultText = await render(renderer, renderContext, templateFile, template);
    core.setOutput("content", resultText);
    if (outputFile && resultText != null) {
      await fsPromises.writeFile(resolvePath(outputFile), resultText, "utf8");
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}

run();
