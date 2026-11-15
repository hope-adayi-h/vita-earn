const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Remove temporary files
  if (fs.existsSync('build_and_status.js')) fs.unlinkSync('build_and_status.js');
  if (fs.existsSync('do_build.js')) fs.unlinkSync('do_build.js');

  console.log('Staging files...');
  execSync('git add -A');

  console.log('Committing changes...');
  execSync('git commit -m "fix: enforce auth protection, dynamic user greeting, circular avatar and activation flow"');

  console.log('Pushing to GitHub origin main...');
  const pushOutput = execSync('git push origin main').toString();
  console.log(pushOutput);

  console.log('=== PUSH SUCCESSFUL ===');
} catch (err) {
  console.error('Error during commit/push:', err.message);
  if (err.stdout) console.log(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  process.exit(1);
}
