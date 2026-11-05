const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
const { isValid, registerUser } = require('./auth_users');
const public_users = express.Router();
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || !/^[A-Za-z0-9_-]{3,40}$/.test(username) ||
      typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ message: 'Provide a username (3-40 letters, numbers, underscores or hyphens) and a password (6-128 characters).' });
  }
  if (isValid(username)) return res.status(409).json({ message: 'Username already exists.' });
  registerUser(username, password);
  return res.status(201).json({ message: 'User successfully registered. You can now log in.', username });
});
// Separate the catalogue data endpoint from its asynchronous Axios consumers.
public_users.get('/catalog', (req, res) => res.json(books));
function catalogue(req) {
  // Use the actual listening port, never a caller-controlled host.
  return axios.get(`http://127.0.0.1:${req.socket.localPort}/catalog`, { timeout: 5000, proxy: false });
}
const unavailable = res => res.status(502).json({ message: 'Unable to retrieve the catalogue.' });
// Task 10: retrieve every book with an async callback and Axios.
public_users.get('/', async (req, res) => {
  try { const response = await catalogue(req); return res.json(response.data); }
  catch { return unavailable(res); }
});
// Task 11: retrieve by ISBN with Promise callbacks.
public_users.get('/isbn/:isbn', (req, res) => {
  return catalogue(req).then(({ data }) => {
    if (!Object.hasOwn(data, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
    return res.json(data[req.params.isbn]);
  }).catch(() => unavailable(res));
});
// Task 12: retrieve books by the specified author with async/await.
public_users.get('/author/:author', async (req, res) => {
  try {
    const { data } = await catalogue(req);
    const matches = Object.fromEntries(Object.entries(data).filter(([, book]) => book.author.toLowerCase() === req.params.author.toLowerCase()));
    return res.json(matches);
  } catch { return unavailable(res); }
});
// Task 13: retrieve books by the specified title with async/await.
public_users.get('/title/:title', async (req, res) => {
  try {
    const { data } = await catalogue(req);
    const matches = Object.fromEntries(Object.entries(data).filter(([, book]) => book.title.toLowerCase() === req.params.title.toLowerCase()));
    return res.json(matches);
  } catch { return unavailable(res); }
});
public_users.get('/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  return res.json(books[req.params.isbn].reviews);
});
module.exports.general = public_users;
