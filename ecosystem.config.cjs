module.exports = {
  apps: [
    {
      name: "radarune",
      script: "npm",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "750M",
      env: { NODE_ENV: "production" },
      time: true,
    },
  ],
};
