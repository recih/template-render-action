import Mustache from "mustache";
import { promises as fsPromises } from "fs";

export async function render(template: string, data: object, options?: object): Promise<string> {
  return Mustache.render(template, data, {}, options);
}

export async function renderFile(file: string, data: object, options?: object): Promise<string> {
  const content = await fsPromises.readFile(file, "utf8");
  return Mustache.render(content, data, {}, options);
}
