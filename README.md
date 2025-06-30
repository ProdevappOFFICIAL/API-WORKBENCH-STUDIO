# Ultra Light Electron Template

An extremely lightweight Electron template with Vite, React, TypeScript, and Tailwind CSS, optimized to compile under 60-75MB.

## 🚀 Features

- ⚡ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React with TypeScript
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📦 **Electron** - Cross-platform desktop apps
- 🔒 **Security** - Context isolation and secure defaults
- 📦 **Optimized Bundle** - Aggressive minification and tree-shaking
- 🎯 **Size Target** - Compiled app under 60-65MB

## 📁 Project Structure

```
ultra-light-electron-app/
├── electron/
│   ├── main.ts          # Main Electron process
│   └── preload.ts       # Preload script
├── src/
│   ├── types/
│   │   └── electron.d.ts # Electron type definitions
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript Node configuration
└── electron-dev.js      # Development server script
```

## 🛠️ Setup

1. **Create project directory:**
   ```bash
   mkdir ultra-light-electron-app
   cd ultra-light-electron-app
   ```

2. **Create all the files** from the template above

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Development mode:**
   ```bash
   npm run electron:dev
   ```

5. **Build for production:**
   ```bash
   npm run dist
   ```

## 🔧 Troubleshooting

### Error: "Cannot find module 'main.js'"

This happens when trying to run Electron before building. **Solution:**

1. Make sure you've created all files from the template
2. Run `npm install` first
3. Use `npm run electron:dev` for development (not `electron .` directly)
4. For production, run `npm run dist` which builds everything first

### Development Setup Steps:

1. **Create the folder structure:**
   ```
   ultra-light-electron-app/
   ├── electron/          (create this folder)
   ├── src/
   │   └── types/         (create this folder)
   ```

2. **Copy all files** from the artifacts above into their respective locations

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development:**
   ```bash
   npm run electron:dev
   ```

## 📦 Size Optimization Features

### Build Optimizations
- **Terser minification** with aggressive compression
- **Tree shaking** to remove unused code
- **Source maps disabled** in production
- **Console.log removal** in production builds
- **Maximum compression** in electron-builder

### Electron Optimizations
- **Minimal preload API** - Only essential functions exposed
- **No dev tools** in production
- **No app icon** to save space
- **Security-first configuration**
- **Single process architecture**

### CSS Optimizations
- **Tailwind purging** - Removes unused CSS classes
- **Minimal custom CSS** - Only essential styles
- **PostCSS optimization**

### Dependency Management
- **Minimal dependencies** - Only essential packages
- **No unnecessary features** - Icons, sounds, etc. removed
- **Optimized React imports**

## 🎯 Size Targets

The template is configured to produce:
- **Windows (NSIS)**: ~45-55MB
- **macOS (DMG)**: ~50-60MB  
- **Linux (AppImage)**: ~60-65MB

## 📝 Scripts

- `npm run dev` - Start Vite dev server only
- `npm run electron:dev` - Start Electron in development mode
- `npm run build` - Build and package the app
- `npm run dist` - Create distribution packages
- `npm run dist:dir` - Build unpacked directory (for testing)

## 🚨 Important Notes

1. **Always use `npm run electron:dev`** for development, not `electron .`
2. **Build before distributing** with `npm run dist`
3. The `dist-electron` folder is created automatically during build
4. Don't run Electron directly until after the first build

This template prioritizes size optimization while maintaining developer experience and modern tooling.
