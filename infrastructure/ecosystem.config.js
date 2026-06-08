module.exports = {
  apps: [
    {
      name: "itms-api",
      script: "./apps/api/server.js",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      error_file: "./logs/pm2/api-error.log",
      out_file: "./logs/pm2/api-out.log",
      merge_logs: true,
      time: true
    },
    {
      name: "itms-ai",
      script: "app.py",
      cwd: "./apps/ai",
      interpreter: "python3",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        MODEL_SERVICE_HOST: "127.0.0.1",
        MODEL_SERVICE_PORT: "8001"
      },
      error_file: "./logs/pm2/ai-error.log",
      out_file: "./logs/pm2/ai-out.log",
      merge_logs: true,
      time: true
    }
  ]
};
