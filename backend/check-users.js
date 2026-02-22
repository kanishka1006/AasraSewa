const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'pragunisanotra',
    password: '',
    database: 'postgres',
    ssl: false,
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT "phoneNumber", "fullName", "passwordHash" FROM users');
        console.log('Users found:', res.rows.length);
        res.rows.forEach(u => {
            console.log(`- ${u.fullName} (${u.phoneNumber}) HashLen: ${u.passwordHash?.length}`);
        });
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
