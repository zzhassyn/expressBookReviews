const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const books = require('./booksdb');
const regd_users = express.Router();
const users = [];
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const isValid = username => users.some(user => user.username === username);
const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username);
  if (!user || typeof password !== 'string') return false;
  const candidate = crypto.scryptSync(password, user.salt, 64);
  return crypto.timingSafeEqual(Buffer.from(user.hash, 'hex'), candidate);
};
const registerUser = (username, password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  users.push({ username, salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });
};
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!authenticatedUser(username, password)) return res.status(401).json({ message: 'Invalid username or password.' });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ message: 'Unable to create session.' });
    req.session.authorization = { accessToken: jwt.sign({ username }, jwtSecret, { expiresIn: '1h' }) };
    res.json({ message: 'Successfully logged in.', username });
  });
});
regd_users.put('/auth/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  const review = req.query.review ?? req.body.review;
  if (typeof review !== 'string' || !review.trim()) return res.status(400).json({ message: 'A nonempty review is required.' });
  const book = books[req.params.isbn];
  Object.defineProperty(book.reviews, req.user.username, { value: review.trim(), writable: true, enumerable: true, configurable: true });
  res.json({ message: 'Review added or updated successfully.', isbn: req.params.isbn, reviews: book.reviews });
});
regd_users.delete('/auth/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  const reviews = books[req.params.isbn].reviews;
  if (!Object.hasOwn(reviews, req.user.username)) return res.status(404).json({ message: 'No review by this user exists for this book.' });
  delete reviews[req.user.username];
  res.json({ message: 'Review deleted successfully.', isbn: req.params.isbn, reviews });
});
module.exports = { authenticated: regd_users, isValid, authenticatedUser, users, registerUser, jwtSecret };
