require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const { authRoutesLimiter } = require('./middleware/rateLimit');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

/** Hinter Reverse-Proxy (z. B. Nginx): echte Client-IP für Rate-Limits — nur setzen, wenn Proxy IPs korrekt setzt. */
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/api/auth', authRoutesLimiter, authRoutes);
app.use('/api/documents', require('./routes/documents'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/gmail', require('./routes/gmail'));
app.use('/api/user', require('./routes/user'));

app.listen(port, () => {
  console.log(`dokuhero backend running on port ${port}`);
});
