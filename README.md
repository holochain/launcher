# Holochain Launcher

Cross-platform Desktop app to run [Holochain](https://www.holochain.org) apps.

## Download Holochain Launcher

| Operating System | [Latest Stable Release](https://github.com/holochain/launcher/releases/tag/v0.11.5)<br>(Holochain v0.2.6) | How to Install                          |
| ---------------- | --------------------------- | --------------------------------------- |
| Windows          | [Download](https://github.com/holochain/launcher/releases/download/v0.11.5/Holochain.Launcher.Beta.2_0.11.5_x64_en-US.msi)<br>          | [Instructions](docs/install-windows.md) |
| macOS | [Download](https://github.com/holochain/launcher/releases/download/v0.11.5/Holochain.Launcher.Beta.2_0.11.5_x64.dmg) |  [Instructions](docs/install-macos.md) |
| Linux | [.AppImage](https://github.com/holochain/launcher/releases/download/v0.11.5/holochain-launcher-beta-2_0.11.5_amd64.AppImage)<br>[.deb](https://github.com/holochain/launcher/releases/download/v0.11.5/holochain-launcher-beta-2_0.11.5_amd64.deb) | [Instructions](docs/install-linux.md) |


# Developers

## Build Apps to run in Launcher

To get started with building holochain apps, you can follow the guide on https://developer.holochain.org/get-started/

## Publish an App to Launcher's App Store

[ TODO ]


# Launcher Development Setup

If you want to develop on the launcher codebase itself, here are the instructions:

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

1. Fetch the necessary binaries:

```bash
yarn fetch:binaries
```

*or* Build the binaries locally (requires Rust and Go installed):

```bash
bash ./scripts/setup-binaries.sh
```


2. Build the Rust Node-add-ons and install dependencies

```bash
yarn setup
```

Download default apps used in launcher

```bash
yarn fetch:default-apps
```

### Development

This guide assumes Nix to be installed. For detailed instructions, visit the [Nix installation guide](https://nixos.org/manual/nix/stable/#chap-installation).

With Nix installed you can enter nix shell

```bash
nix develop
```

and run the dev command.

```bash
$ yarn dev
```

To run two independent instances of launcher in parallel you may run

```bash
$ yarn dev-2
```

#### Build

The following commands build the final distributables for the respsective platforms:

```bash
# For windows
$ yarn build:win

# For macOS x64
$ yarn build:mac-x64

# For macOS arm64
$ yarn build:mac-arm64

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
