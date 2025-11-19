const { MongoClient } = require('mongodb');
const uri = 'mongodb://192.168.2.163:27017';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
(async () => {
  try {
    await client.connect();
    const res = await client.db('admin').command({ ping: 1 });
    console.log('PING_OK', JSON.stringify(res));
  } catch (err) {
    console.error('PING_ERROR', err && err.message ? err.message : err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
})();
