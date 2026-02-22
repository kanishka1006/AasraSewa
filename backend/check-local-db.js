const { Client } = require('pg');

const configs = [
    { user: 'pragunisanotra', password: '', db: 'postgres', port: 5432 },
    { user: 'postgres', password: '', db: 'postgres', port: 5432 },
    { user: 'postgres', password: 'password', db: 'postgres', port: 5432 },
    { user: 'postgres', password: 'password123', db: 'postgres', port: 5432 }
];

async function tryConnect(config) {
    const client = new Client({
        host: '127.0.0.1',
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.db,
        ssl: false,
        connectionTimeoutMillis: 2000,
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS: Connected to local DB with user=${config.user}, pass=${config.password || '(none)'}`);
        await client.end();
        return true;
    } catch (err) {
        // console.log(`❌ Failed: user=${config.user} - ${err.message}`);
        return false;
    }
}

async function run() {
    console.log('Testing local Postgres connections...');
    for (const config of configs) {
        if (await tryConnect(config)) {
            process.exit(0);
        }
    }
    console.log('❌ All local connection attempts failed.');
    process.exit(1);
}

run();
