### {{title}}

{{author}}

[![Deploy to Rung](https://i.imgur.com/uijt57R.png)](https://app.rung.com.br/deploy)

![rung-cli {{rungCliVersion}}](https://img.shields.io/badge/rung--cli-{{rungCliVersion}}-blue.svg?style=flat-square)
![{{name}} {{version}}](https://img.shields.io/badge/{{escapedName}}-{{version}}-green.svg?style=flat-square)

{{description}}

{{#if icon}}
    <img align="left" width="256" src="./icon.png" />
{{/if}}

#### Dependencies

{{#each dependecies}}
- `{{name}}`: `{{version}}`
{{/each}}

#### Parameters

|Parameter | Type | Description |
|----------|------|-------------|
{{#each parameters}}
| `{{name}}` | `{{type}}` | {{description}} |
{{/each}}
