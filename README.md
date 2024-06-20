# Holochain Launcher Prototype

Electron based version of the Holochain Launcher. Currently in prototype phase.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

Build the sidecar binaries (requires Rust and Go installed):

```bash
bash ./scripts/setup-binaries.sh
```

or fetch with

```bash
yarn fetch:binaries
```

Build the Node Rust-add-ons and install dependencies

```bash
yarn setup
```

Download default app

```bash
yarn fetch:default-apps
```

### Development

## Nix Installation

Nix needs to be installed. For detailed instructions, visit the [Nix installation guide](https://nixos.org/manual/nix/stable/#chap-installation).

```bash
nix develop
```

```bash
$ yarn dev
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

## License

[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

Copyright (C) 2019 - 2021, Holochain Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0). This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.
