const fs = require('fs');
const path = require('path');

function deleteRecursively(dirPath) {
  if (fs.existsSync(dirPath)) {
    if (fs.statSync(dirPath).isDirectory()) {
      fs.readdirSync(dirPath).forEach(file => {
        const filePath = path.join(dirPath, file);
        deleteRecursively(filePath);
      });
      fs.rmdirSync(dirPath);
    } else {
      fs.unlinkSync(dirPath);
    }
  }
}

function cleanupProject() {
  console.log('🧹 Cleaning up project...\n');
  
  const pathsToClean = [
    // Build artifacts
    'dist',
    'dist-electron',
    'release',
    
    // Cache directories
    'node_modules/.cache',
    'node_modules/.vite',
    '.vite',
    
    // Temporary files
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db',
    
    // Source maps
    '**/*.map'
  ];
  
  pathsToClean.forEach(pattern => {
    if (pattern.includes('*')) {
      // Handle glob patterns (simplified)
      if (pattern === '*.log') {
        fs.readdirSync('.').forEach(file => {
          if (file.endsWith('.log')) {
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
          }
        });
      }
    } else {
      if (fs.existsSync(pattern)) {
        deleteRecursively(pattern);
        console.log(`Deleted: ${pattern}`);
      }
    }
  });
  
  console.log('\n✅ Cleanup completed!');
}

// Run cleanup
cleanupProject();