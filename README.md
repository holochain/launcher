# Holochain Launcher

Cross-platform Desktop app to run [Holochain](https://www.holochain.org) apps.

## Download Holochain Launcher

[Latest Stable Release](https://github.com/holochain/launcher-electron/releases/tag/v0.300.0)<br>(Holochain v0.3.1)

### Download Latest Stable Version

> [!IMPORTANT]
> If you are on Ubuntu 24.04, installation with the deb file is highly recommended. Otherwise, follow the instructions [here](./docs/ubuntu-24.md)

| macOS | Windows | Linux |
| ----- | ------- | ----- |
| [Download (M1 / Apple Silicon)](https://github.com/holochain/launcher/releases/download/v0.300.0/holochain-launcher-0.3-0.300.0-arm64.dmg)<br> [Download (Intel)](https://github.com/holochain/launcher/releases/download/v0.300.0/holochain-launcher-0.3-0.300.0-arm64.dmg) | [Download](https://github.com/holochain/launcher/releases/download/v0.300.0/holochain-launcher-0.3-0.300.0-setup.exe) | [deb (recommended)](https://github.com/holochain/launcher/releases/download/v0.300.0/holochain-launcher-0.3_0.300.0_amd64.deb) <br> [AppImage](https://github.com/holochain/launcher/releases/download/v0.300.0/holochain-launcher-0.3-0.300.0.AppImage)<br>
 |

The latest version stable version uses Holochain v0.3.1. More details can be found on the [Release page](https://github.com/holochain/launcher-electron/releases/tag/v0.300.0)



### Download Previous Versions

[Latest Release for Holochain 0.2](https://github.com/holochain/launcher/releases/tag/v0.11.5)<br>(Holochain v0.2.6)


# Developers

## Build Apps to run in Launcher

To get started with building holochain apps, you can follow the guide on https://developer.holochain.org/get-started/

## Publish an App to Launcher's App Store

### Enable Developer Mode and Create your Publisher Profile
- Once installed, open the settings window by clicking the gear icon in the upper right.
- The "Publish" tab is hidden by default.  To make it visible, click "System Settings" on the left
- In System Settings, click the button to install developer tools.  This will insall devhub, and enable Launcher as a devhub node and enable the "Publish" tab.
- Switch to the "Publish" tab.
- Follow the instructions and click the "Set up your publisher profile" button
- Choose a publisher icon image, enter your name, location, and website then click the "add" button.

### Publish your App
- Select an icon image for your App (TODO: add image specs)
- Click "Choose File" and browse to your .webhapp file (TODO: add links and refs for creating .webhapp files)
- Complete the form by editing the name, adding a short description and long description if you want, as well as the version number for your App
- Click "Publish your App"

You will now see your published app settings in the publish tab, and your app will now appear in the Appstore where you can install it!  Your app will also be available to others after a short time as it is distributed via DevHub.

# Verified Apps
TODO: add verified app content and instructions to request verification.

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
