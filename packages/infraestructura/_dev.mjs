import { MongoMemoryReplSet } from 'mongodb-memory-server';
const s = await MongoMemoryReplSet.create({ replSet: { count: 1, name: 'rs0' }, instanceOpts: [{ port: 27017 }] });
console.log('MONGO LISTO', s.getUri());
setInterval(() => {}, 1 << 30);
