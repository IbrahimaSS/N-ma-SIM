const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = "D:\\N'ma SIM_OSC\\Dev\\Frontend\\nma-sim-frontend";
const oldBackendDir = "D:\\N'ma SIM_OSC\\Dev\\Frontend\\nma-sim-backend";

// Create frontend and backend directories
if (!fs.existsSync(path.join(rootDir, 'frontend'))) fs.mkdirSync(path.join(rootDir, 'frontend'));
if (!fs.existsSync(path.join(rootDir, 'backend'))) fs.mkdirSync(path.join(rootDir, 'backend'));

// 1. Move Frontend files using git mv to preserve history
console.log("Moving frontend files...");
const items = fs.readdirSync(rootDir);
for (const item of items) {
    if (['.git', 'frontend', 'backend', 'node_modules', '.next', 'move.js'].includes(item)) continue;
    
    try {
        // Try git mv first
        execSync(`git mv "${item}" frontend/`, { cwd: rootDir, stdio: 'pipe' });
    } catch (e) {
        // If untracked, just move it normally
        fs.renameSync(path.join(rootDir, item), path.join(rootDir, 'frontend', item));
    }
}
// Also move untracked node_modules and .next if they exist
if (fs.existsSync(path.join(rootDir, 'node_modules'))) fs.renameSync(path.join(rootDir, 'node_modules'), path.join(rootDir, 'frontend', 'node_modules'));
if (fs.existsSync(path.join(rootDir, '.next'))) fs.renameSync(path.join(rootDir, '.next'), path.join(rootDir, 'frontend', '.next'));


// 2. Copy Backend files
console.log("Copying backend files...");
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        if (path.basename(src) === '.git') return; // Skip .git
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(oldBackendDir, path.join(rootDir, 'backend'));

console.log("Done!");
