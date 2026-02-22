const { Client } = require('pg');

const client = new Client({
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT) || 5433,
    user: process.env.POSTGRES_USER || 'aasra_admin',
    password: process.env.POSTGRES_PASSWORD || 'password123',
    database: 'postgres', // Try default DB first
    ssl: false,
    connectionTimeoutMillis: 5000,
});

console.log('Script config:', {
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT) || 5433,
    user: process.env.POSTGRES_USER || 'aasra_admin',
    db: process.env.POSTGRES_DB || 'aasra_main'
});

async function run() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connected!');
        const res = await client.query('SELECT version()');
        console.log('Version:', res.rows[0].version);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
