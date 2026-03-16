module.exports = {
  apps: [
    {
      name: 'mecabal-backend',
      script: 'dist/apps/monolith/apps/monolith/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      time: true,
    },
  ],
};
