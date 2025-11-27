const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const webhookRoutes = require('./routes/webhook');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error', err));

app.use('/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/', (req, res) => res.send({status: 'ok'}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
