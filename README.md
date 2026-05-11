# Fruit Market ERP (React + Tauri)

Desktop ERP app built with React, Vite, TypeScript, Tailwind CSS, and Tauri v2.

## Prerequisites (Windows)

1. Node.js 20+ and npm
2. Rust via rustup
3. Visual Studio Build Tools 2022 with:
	- Desktop development with C++
	- MSVC v143 toolset
	- Windows 10/11 SDK
4. Microsoft Edge WebView2 runtime

## Install

```bash
npm install
```

## Development

```bash
# web app
npm run dev

# desktop app (Tauri)
npm run desktop:dev
```

## Production build

```bash
# web bundle
npm run build

# desktop installer/bundle
npm run desktop:build
```

## Desktop preflight checks

```bash
# verifies rust, cargo, msvc/sdk and tauri environment
npm run desktop:info
```

## App icons

Tauri icon source is at [src-tauri/icons/app-icon.svg](src-tauri/icons/app-icon.svg).

Regenerate icons any time with:

```bash
npm run desktop:icon
```

The generated icons are already configured in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).
