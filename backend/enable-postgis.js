const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'pragunisanotra', // Using the known working user
    password: '',
    database: 'postgres',
    ssl: false,
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to local DB.');

        console.log('🔧 Enabling PostGIS extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        console.log('✅ PostGIS Enabled!');

    } catch (err) {
        console.error('❌ Error enabling PostGIS:', err);
        // It might fail if user is not superuser, but typically they are on mac
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
