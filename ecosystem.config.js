module.exports = {
    apps: [
        {
            name: 'NestJSApp',
            script: 'dist/main.js',
            instances: 1,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            restart_delay: 5000,
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
