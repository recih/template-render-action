import * as process from "process";
import * as path from "path";
import * as execa from "execa";
import { promises as fsPromises } from "fs";
import * as glob from "@actions/glob";

async function removeResultFiles(globPattern: string) {
  const globber = await glob.create(globPattern);
  for await (const file of globber.globGenerator()) {
    const destFile = file.replace(/\.[^.]+$/, "");
    const exists = await fsPromises.stat(destFile).then(
      () => true,
      () => false,
    );
    if (exists) {
      await fsPromises.unlink(destFile);
    }
  }
}

const TEST_TEMPLATE_FILE_PATTERN = ["__tests__/**/*.ejs", "__tests__/**/*.mustache"];

afterEach(async () => {
  await removeResultFiles(TEST_TEMPLATE_FILE_PATTERN.join("\n"));
});

test("test ejs template with glob mode", async () => {
  const vars = {
    name: "test",
    version: "1.0.0",
  };
  process.env["INPUT_TEMPLATE-FILE"] = "__tests__/**/*.ejs";
  process.env["INPUT_GLOB"] = "true";
  process.env["INPUT_ENGINE"] = "ejs";
  process.env["INPUT_VARS"] = JSON.stringify(vars);
  const mainPath = path.join(__dirname, "..", "lib", "main.js");
  await execa.node(mainPath);

  // check if the action performed as expected
  const content = await fsPromises.readFile(path.join(__dirname, "../__tests__/test1.json"), "utf8");
  const outputData = JSON.parse(content);
  expect(outputData.name).toBe(vars.name);
  expect(outputData.version).toBe(vars.version);
  expect(outputData.serverUrl).toBe("https://github.com");
  expect(outputData.templateFile).toBe(process.env["INPUT_TEMPLATE-FILE"]);
  expect(outputData.templateEngine).toBe(process.env["INPUT_ENGINE"]);
});

test("test mustache template with glob mode", async () => {
  const vars = {
    name: "test",
    version: "1.0.0",
  };
  process.env["INPUT_TEMPLATE-FILE"] = "__tests__/**/*.mustache";
  process.env["INPUT_GLOB"] = "true";
  process.env["INPUT_ENGINE"] = "mustache";
  process.env["INPUT_VARS"] = JSON.stringify(vars);
  const mainPath = path.join(__dirname, "..", "lib", "main.js");
  await execa.node(mainPath);

  // check if the action performed as expected
  const content = await fsPromises.readFile(path.join(__dirname, "../__tests__/test1.json"), "utf8");
  const outputData = JSON.parse(content);
  expect(outputData.name).toBe(vars.name);
  expect(outputData.version).toBe(vars.version);
  expect(outputData.serverUrl).toBe("https://github.com");
  expect(outputData.templateFile).toBe(process.env["INPUT_TEMPLATE-FILE"]);
  expect(outputData.templateEngine).toBe(process.env["INPUT_ENGINE"]);
});
