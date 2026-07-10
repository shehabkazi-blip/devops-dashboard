const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/devops_dashboard';

  mongoose.set('strictQuery', true);

  const connectWithRetry = () => {
    mongoose
      .connect(uri)
      .then(() => console.log(`[db] connected -> ${uri}`))
      .catch((err) => {
        console.error('[db] connection failed, retrying in 5s...', err.message);
        setTimeout(connectWithRetry, 5000);
      });
  };

  connectWithRetry();

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
}

module.exports = connectDB;
