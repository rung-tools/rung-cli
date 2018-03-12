# Rung CLI

[![NPM](https://nodei.co/npm/rung-cli.png)](https://npmjs.org/package/rung-cli)

[![Version](https://img.shields.io/npm/v/rung-cli.svg)](https://www.npmjs.com/package/rung-cli)
[![Build Status](https://travis-ci.org/rung-tools/rung-cli.svg?branch=master)](https://travis-ci.org/rung-tools/rung-cli)
[![Code Climate](https://codeclimate.com/github/rung-tools/rung-cli/badges/gpa.svg)](https://codeclimate.com/github/rung-tools/rung-cli)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/rung-tools/rung-cli/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/rung-tools/rung-cli/?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/rung-tools/rung-cli/badge.svg)](https://snyk.io/test/github/rung-tools/rung-cli)
[![Codecov](https://codecov.io/gh/rung-tools/rung-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/rung-tools/rung-cli)
[![Downloads](https://img.shields.io/npm/dt/rung-cli.svg)](https://www.npmjs.com/package/rung-cli)

Command line tools for Rung

## Installation

`sudo npm install -g rung-cli`

This will make the command `rung` available globally.

## Documentation

You can checkout the last docs in [this link](https://developers.rung.com.br/docs/)!

## Features

- Create blank apps
- Generate `.rung` packages
- Run apps locally in CLI mode
- Publish apps to Rung Store (public and private)
- Generate boilerplate code for app
- Generate README.md file to publish
- Test autocomplete directly in the terminal
- Hot reloading and live development

## Usage

`rung [build|run|publish|boilerplate|readme|db]`

### Commands


| Command       | Description |
|---------------|-------------|
| `build`       | Generate a .rung package |
| `run`         | Execute the current app |
| `publish`     | Publish app to store |
| `boilerplate` | Generate boilerplate code for the app |
| `readme`      | Generate the README.md file to publish |
| `db read`     | Read from app database |
| `db clear`    | Drop app database |

### Options

| Option           | Description |
|------------------|-------------|
| `-o`, `--output` | Where to save the built package |
| `--version`      | Displays versions |
| `--private`      | If set, app is published for current user only |
| `--raw`          | Displays returned cards outside a table |
| `--live`         | With `run`, starts hot compiling and preview on browser |
