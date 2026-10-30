// Docker-free development services. Persistent data stays in ignored logs/.
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');

const runtime = path.resolve(__dirname, '../logs/runtime');
process.env.MONGOMS_DOWNLOAD_DIR = path.join(runtime, 'mongodb-binaries');
const { MongoMemoryServer } = require('mongodb-memory-server');
const aedes = require('aedes')();

async function main() {
    const dbPath = path.join(runtime, 'mongodb-data');
    fs.mkdirSync(dbPath, { recursive: true });
    const mongo = await MongoMemoryServer.create({
        binary: { version: '7.0.16' },
        instance: { port: 27017, portGeneration: false, ip: '127.0.0.1', dbName: 'aasrasewa', dbPath, storageEngine: 'wiredTiger', args: ['--wiredTigerCacheSizeGB', '0.25'] },
    });
    console.log(`MongoDB ready: ${mongo.getUri('aasrasewa')}`);
    const mqtt = net.createServer(aedes.handle);
    mqtt.on('error', async error => { console.error(error.message); await mongo.stop(); process.exit(1); });
    mqtt.listen(1883, '127.0.0.1', () => {
        console.log('MQTT ready: mqtt://127.0.0.1:1883');
        process.send?.({ type: 'ready' });
    });
    let stopping = false;
    mongo.instanceInfo.instance.on('instanceClosed', () => {
        if (!stopping) { console.error('MongoDB stopped unexpectedly. Restart the local stack.'); process.exit(1); }
    });
    const stop = async () => {
        if (stopping) return;
        stopping = true;
        mqtt.close();
        aedes.close();
        await mongo.stop();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    process.on('message', message => { if (message?.type === 'shutdown') void stop(); });
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
