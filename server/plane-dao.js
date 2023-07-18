'use strict'

const sqlite = require('sqlite3');
const { Reservation } = require('./planeModels');
const { Plane } = require('./planeModels');

const db = new sqlite.Database('planes.db', (err) => {
  if (err) throw err;
});

// Get all planes
exports.listPlanes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM planes';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      }
      const planes = rows.map((p) => new Plane(p.id, p.type, p.F, p.P, p.occupiedSeats));
      resolve(planes);
    });
  });
}

// Get specified plane
exports.getPlane = (id) => {
  return new Promise((resolve, reject) => {
    const sql1 = 'SELECT * FROM planes WHERE id = ?';
    db.get(sql1, [id], (err, row) => {
      if (err) {
        reject(err);
      }
      if (row == undefined)
        resolve({ error: 'Error 404: Plane not found.' }); 
      else {
        const plane = new Plane(row.id, row.type, row.F, row.P);
        const sql2 = 'SELECT * FROM reservations WHERE planeId = ?';
        db.all(sql2, [plane.id], (err, rows) => {
          if (err)
            reject(err);
          else {
            plane.reservedSeats = [];
            for(let i in rows) {
              const r = new Reservation(rows[i].id, rows[i].planeId, rows[i].userId, rows[i].F, rows[i].P);
              plane.reservedSeats.push(r);
            }
            resolve(plane);
          }
        });
      }
    });
  });
}

// Reserve seats on a plane
exports.createReservation = async (order) => {
  return new Promise(async (resolve, reject) => {
    let alreadyReserved = [];
    // query used to check if a seat is already reserved
    const sql1 = "SELECT COUNT(*) AS count FROM reservations WHERE planeId = ? and F = ? and P = ?";
    try {
      for (let i in order.requested) {
        const row = await new Promise((resolve, reject) => {
          db.get(sql1, [order.requested[i].planeId, order.requested[i].F, order.requested[i].P], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (row.count === 0) {
          // query that inserts the reservation when it's not already present
          const sql2 = 'INSERT INTO reservations (planeId, userId, F, P) VALUES (?, ?, ?, ?)';
          await new Promise((resolve, reject) => {
            db.run(sql2, [order.requested[i].planeId, order.requested[i].userId, order.requested[i].F, order.requested[i].P], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        } 
        else
          // if the seat has been already reserved it gets added to the array of conflicting seats
          alreadyReserved.push({ F: order.requested[i].F, P: order.requested[i].P });
      }
      if (alreadyReserved.length > 0) {
        for (let i in order.requested) {
          // query that deletes all the new requested seats that have been registered when there is at least a conflict
          const sql3 = "DELETE FROM reservations WHERE planeId = ? and userId = ? and F = ? and P = ?";
          await new Promise((resolve, reject) => {
            db.run(sql3, [order.requested[i].planeId, order.requested[i].userId, order.requested[i].F, order.requested[i].P], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
        // message returned to caller when conflics arise containing the already reserved seats 
        resolve({ message: "Seats already requested: ", error: alreadyReserved });
      } else {
        // message returned to caller when no conflicts arise
        resolve({ message: "Reserved " + order.requested.length + " seat/s." });
      }
    } catch (err) {
      reject(err);
    }
  });
};

exports.deleteReservation = (planeId, userId) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM reservations WHERE planeId = ? and userId = ?";
    db.run(sql, [planeId, userId], (err) => { 
      if (err) 
        reject({ error: "Failed in deleting reservation for user id = " + userId + " on plane id = " + planeId }); 
      resolve({ message: "Deleted reservation for user id = " + userId + " on plane id = " + planeId });
    });
  });
}