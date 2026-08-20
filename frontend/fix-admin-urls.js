const fs = require('fs');
const { glob } = require('glob');

async function run() {
  const files = await glob('src/**/*.tsx');
  let count = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('const BACKEND = "http://localhost:3001";')) {
      content = content.replace(
        'const BACKEND = "http://localhost:3001";',
        'const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";'
      );
      changed = true;
    }
    
    if (content.includes('const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";')) {
        content = content.replace(
            'const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";',
            'const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:3001";'
        );
        changed = true;
    }
    
    if (content.includes('fetch("http://localhost:3001/api/parametres"')) {
      content = content.replace(
        'fetch("http://localhost:3001/api/parametres"',
        'fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/parametres`'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
      count++;
    }
  }
  console.log(`Replaced in ${count} files.`);
}

run().catch(console.error);
