// Path resolver utility for Node.js CommonJS environment
// This will allow server-side code to resolve @shared/* imports
const path = require('path');
const Module = require('module');
const fs = require('fs');

// Store the original require implementation
const originalRequire = Module.prototype.require;

// Override require to handle @shared/* paths
Module.prototype.require = function(modulePath) {
  if (modulePath.startsWith('@shared/')) {
    const resolvedPath = path.resolve(process.cwd(), 'dist/server', '../shared', modulePath.replace('@shared/', ''));
    
    // Try with different extensions/paths in order
    if (fs.existsSync(resolvedPath + '.js')) {
      return originalRequire.call(this, resolvedPath + '.js');
    }
    
    if (fs.existsSync(resolvedPath)) {
      return originalRequire.call(this, resolvedPath);
    }
    
    // Try direct require as fallback
    try {
      return originalRequire.call(this, modulePath);
    } catch (err) {
      console.error(`Failed to resolve module: ${modulePath}`, err);
      throw err;
    }
  }
  
  // Default behavior for all other modules
  return originalRequire.call(this, modulePath);
};

// Export the resolver for explicit use
exports.resolve = function(modulePath) {
  if (modulePath.startsWith('@shared/')) {
    const resolvedPath = path.resolve(process.cwd(), 'dist/server', '../shared', modulePath.replace('@shared/', ''));
    return resolvedPath;
  }
  return modulePath;
};