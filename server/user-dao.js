'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');

const db = new sqlite.Database('planes.db', (err) => {
  if (err) throw err;
});

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        const user = { id: row.id, username: row.email, name: row.name, role: row.role }
        resolve(user);
      }
    });
  });
};

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
    if (err) {
      reject(err);
    } else if (row === undefined) {
      resolve(false);
    }
    else {
      const user = { id: row.id, username: row.email, name: row.name, role: row.role };

      crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) { 
      if (err) reject(err);
      if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) 
        resolve(false);
      else
        resolve(user);
      });
    }
    });
  });
};