# Rung CLI

Command line tools for Rung

## Installation

`sudo npm install -g rung-cli`

This will make the command `rung` available globally.

## Features

- Create blank extensions
- Generate `.rung` packages
- Run extensions locally in CLI mode
- [FUTURE] Publish extensions to Rung Store

## Usage

`rung [init|build|run]`

### Commands


| Command | Description |
|---------|-------------|
| `init`  | Initialize a blank extension project |
| `build` | Generate a .rung package |
| `run`   | Execute the current extension |

### Options

| Option           | Description |
|------------------|-------------|
| `-o`, `--output` | Where to save the built package |
| `--version`      | Displays versions |
