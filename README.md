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

Build the Node Rust-add-ons

```bash
yarn setup
```

Install dependencies

```bash
yarn
```

Download default app

```bash
mkdir resources/default-apps
yarn fetch:default-apps
```

### Development

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
