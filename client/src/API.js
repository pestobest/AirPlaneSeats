import { Plane, Reservation } from "./planeModels";
const SERVER_URL = 'http://localhost:3001';

const getPlanes = async () => {
  const response = await fetch(`${SERVER_URL}/api/planes`);
  if(response.ok) {
    const planesJson = await response.json();
    return planesJson.map(p => new Plane(p.id, p.type, p.F, p.P));
  }
  else
    throw new Error('Internal server error');
}

const getPlane = async (id) => {
  const response = await fetch(`${SERVER_URL}/api/planes/${id}`);
  if(response.ok) {
    const planeJson = await response.json();
    let plane = new Plane(planeJson.id, planeJson.type, planeJson.F, planeJson.P);
    plane.reservedSeats = [];
    for (let i = 0; i < planeJson.reservedSeats.length; i++) 
      plane.reservedSeats.push(new Reservation(planeJson.reservedSeats[i].id, planeJson.reservedSeats[i].planeId, planeJson.reservedSeats[i].userId, planeJson.reservedSeats[i].F, planeJson.reservedSeats[i].P));
    return plane;
  }
  else
    throw new Error('Internal server error');
}

const createReservation = async (order) => {
  const response = await fetch(`${SERVER_URL}/api/planes/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ requested: order.requested }),
    credentials: 'include'
  });
  
  if(response.status === 400) {
    // if the response status is 400 the API throws an exception to be managed 
    const errMessage = await response.json();
    throw errMessage;
  } 
  else return null;
}

const deleteReservation = async (planeId, userId) => {
  const response = await fetch(`${SERVER_URL}/api/planes/`, {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ planeId: planeId, userId: userId }),
    credentials: 'include'
  });
 if(response.error) {
    const errMessage = await response.json();
    throw errMessage;
  }
  else return null;
}

const logIn = async (credentials) => {
  return getJson(fetch(`${SERVER_URL}/api/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(`${SERVER_URL}/api/sessions/current/`, {
    // this parameter specifies that authentication cookie must be forwared
    credentials: 'include'
  }));
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(`${SERVER_URL}/api/sessions/current/`, {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  }));
}

function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}

const API = { getPlanes, getPlane, createReservation, deleteReservation, logIn, logOut, getUserInfo };
export default API;