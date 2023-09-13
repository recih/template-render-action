# Template Render Action
[![build-test](https://github.com/recih/template-render-action/actions/workflows/test.yml/badge.svg)](https://github.com/recih/template-render-action/actions/workflows/test.yml)

A github action to render ejs/mustache template files using github context.

This action is inspired by [kikyous/template-action](https://github.com/kikyous/template-action), with some additional features. Thanks to kikyous!

# Input:
* `template-file`: Input template file path. 
* `template`: Input template string.
  * You must specify `template-file` or `template` 
* `vars`: [optional] Input variables. A dictionary of variables in JSON format to be used in the template. Or specify a `.yml/.yaml/.json` file path.
* `engine`: [optional] Choose template engine. Default is `ejs`.
  * Currently, you can choose `ejs` or `mustache`
* `options`: [optional] A JSON format string of options to be passed to the template engine.
  * For example, `{pretty: true}`
* `output-file`: [optional] Output file path.
  * If not specified, you can get rendered result from the action output with `${{ steps.<step-id>.outputs.content }}`.
* `glob`: [optional] Glob mode. Default is `false`. If `true`, glob mode is enabled:
  * `template-file` will be considered as a glob pattern (see [`@actions/glob`](https://github.com/actions/toolkit/tree/master/packages/glob)).
  * `template`/`output-file` will be ignored.
  * `content` field in action output will not be set.
  * The output file name will be the same as the input file name, without the file extension. e.g., `'data.json.template'` will be rendered to `'data.json'`

# Output:
* `content`: template render result. (Only when glob mode is disabled)

# Usage
```yml
name: Example for basic usage
on:
  push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: recih/template-render-action@v1
        id: template
        with:
          template: |
            <% context.payload.commits.forEach(function(c){ %>
            [✅ <%= c.message %>](<%= c.url %>)\n
            <% }); %>
            commiter: <%= context.payload.head_commit.author.name %>
          vars: |
            { "name": "${{ steps.stepId.outputs.name }}" }

      - name: Get the render output
        run: echo "${{ steps.template.outputs.content }}"
```

```yml
name: Example for glob mode
on:
  push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: recih/template-render-action@v1
        with:
          template-file: "**/*.template"
          glob: true
```

# Template syntax

* `EJS`: https://github.com/mde/ejs
* `mustache`: https://github.com/janl/mustache.js

# Render context

Following objects are exposed, and can be used in template file:

* `context`: The [`Context`](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts) object in [`@actions/github`](https://github.com/actions/toolkit/tree/main/packages/github)
* `env`: The `process.env` object. You can access the environment variables with `env.<key>`

you can explore `context` use below action
```yml
name: Test
on:
  push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: recih/template-render-action@v1
        id: template
        with:
          template: "<%- JSON.stringify(context, undefined, 2) %>"

      - name: Get the render output
        run: echo "${{ steps.template.outputs.content }}"
```

# TODO

* [ ] Support more template engines

## Credits

The initial GitHub action has been created by [recih](https://github.com/recih) at
[recih/template-render-action](https://github.com/recih/template-render-action).
