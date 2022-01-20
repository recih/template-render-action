import { Options, render as _render, renderFile as _renderFile } from "ejs";

const renderOptions: Options = {
  outputFunctionName: "echo",
};

export async function render(template: string, data: object, options?: object): Promise<string> {
  return _render(template, data, { ...renderOptions, ...options });
}

export async function renderFile(file: string, data: object, options?: object): Promise<string> {
  return _renderFile(file, data, { ...renderOptions, ...options });
}
