const fs = require('fs');
const path = require('path');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      try {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
          calculateSize(path.join(currentPath, file));
        });
      } catch (error) {
        console.warn(`Cannot read directory: ${currentPath}`);
      }
    } else {
      totalSize += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeSize() {
  console.log('📊 Analyzing bundle sizes...\n');
  
  const paths = {
    'Source (src)': 'src',
    'Build Output (dist)': 'dist',
    'Electron Build (dist-electron)': 'dist-electron',
    'Release Directory': 'release',
    'Node Modules': 'node_modules',
    'Assets': 'assets'
  };
  
  let totalProjectSize = 0;
  const results = [];
  
  Object.entries(paths).forEach(([name, dirPath]) => {
    const size = getDirectorySize(dirPath);
    totalProjectSize += size;
    results.push({ name, size, path: dirPath });
  });
  
  // Sort by size (largest first)
  results.sort((a, b) => b.size - a.size);
  
  console.log('Directory sizes:');
  console.log('================');
  results.forEach(({ name, size, path }) => {
    const percentage = totalProjectSize > 0 ? ((size / totalProjectSize) * 100).toFixed(1) : '0.0';
    console.log(`${name.padEnd(25)} ${formatBytes(size).padStart(10)} (${percentage}%)`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total Project Size: ${formatBytes(totalProjectSize)}`);
  
  // Check built app size
  const releaseDir = 'release';
  if (fs.existsSync(releaseDir)) {
    const releaseFiles = fs.readdirSync(releaseDir);
    const appFiles = releaseFiles.filter(file => 
      file.includes('.exe') || file.includes('.dmg') || file.includes('.AppImage') || file.includes('.deb')
    );
    
    if (appFiles.length > 0) {
      console.log('\n🚀 Built Application Files:');
      console.log('===========================');
      appFiles.forEach(file => {
        const filePath = path.join(releaseDir, file);
        const size = fs.statSync(filePath).size;
        const targetSize = 65 * 1024 * 1024; // 65MB
        const isWithinTarget = size <= targetSize;
        const status = isWithinTarget ? '✅' : '❌';
        
        console.log(`${status} ${file}`);
        console.log(`   Size: ${formatBytes(size)}`);
        console.log(`   Target: ${formatBytes(targetSize)}`);
        console.log(`   Status: ${isWithinTarget ? 'Within target' : 'Exceeds target by ' + formatBytes(size - targetSize)}`);
        console.log('');
      });
    }
  }
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('=================================');
  
  const nodeModulesSize = getDirectorySize('node_modules');
  const distSize = getDirectorySize('dist');
  const electronDistSize = getDirectorySize('dist-electron');
  
  if (nodeModulesSize > 200 * 1024 * 1024) { // 200MB
    console.log('• Consider removing unused dependencies');
  }
  
  if (distSize > 10 * 1024 * 1024) { // 10MB
    console.log('• Frontend bundle is large - consider code splitting');
  }
  
  if (electronDistSize > 5 * 1024 * 1024) { // 5MB
    console.log('• Electron main process bundle is large');
  }
  
  console.log('• Use "npm run build:dir" to build without packaging for faster testing');
  console.log('• Run "npm run analyze" to analyze bundle composition');
}

// Run the analysis
analyzeSize();