const { spawnSync } = require('child_process');
const path = require('path');

const cracoBin = path.join(__dirname, '..', 'node_modules', '@craco', 'craco', 'dist', 'bin', 'craco.js');

const result = spawnSync(process.execPath, [cracoBin, 'build'], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    INLINE_RUNTIME_CHUNK: 'false',
  },
});

process.exit(result.status || 0);
