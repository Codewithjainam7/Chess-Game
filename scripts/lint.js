import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const dirs = ['src/js', 'tests'];
let hasError = false;

for (const dir of dirs) {
  const fullDir = path.resolve(dir);
  if (!fs.existsSync(fullDir)) continue;

  const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(fullDir, file);
    try {
      execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' });
      console.log(`✓ Syntax OK: ${path.relative(process.cwd(), filePath)}`);
    } catch (err) {
      console.error(`✗ Syntax Error in ${filePath}:`, err.stderr?.toString());
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All files passed syntax check.');
}
