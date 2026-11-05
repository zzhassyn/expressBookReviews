const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const crypto = require('node:crypto');
const { authenticated, jwtSecret } = require('./router/auth_users');
const { general } = require('./router/general');
const app = express();
app.use(express.json());
app.use('/customer', session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 3600000 }
}));
app.use('/customer/auth', (req, res, next) => {
  const token = req.session.authorization?.accessToken;
  if (!token) return res.status(401).json({ message: 'Please log in first.' });
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' }); }
});
app.use('/customer', authenticated);
app.use('/', general);
const PORT = process.env.PORT || 5000;
if (require.main === module) app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
module.exports = app;
