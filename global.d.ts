// Ambient declarations for non-code imports.
// Allows side-effect importing of global stylesheets (e.g. `import "./globals.css"`)
// under strict TypeScript without a module-resolution error.
declare module "*.css";
