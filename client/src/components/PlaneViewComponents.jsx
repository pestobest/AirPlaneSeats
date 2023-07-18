import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import API from '../API';
import './PlaneViewCSS.css';

function PlaneView(props) {
  let { planeId } = useParams();
  const { askUpdate, setAskUpdate, user } = props;
  const [plane, setPlane] = useState();
  const [nReserved, setNReserved] = useState();
  const [nAvailable, setNAvailable] = useState();
  const [nRequested, setNRequested] = useState(0);
  const [userHasReserved, setUserHasReserved] = useState(false);
  const [seats, setSeats] = useState([]);
  const [newReservations, setNewReservations] = useState([]);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const getPlane = async () => {
      const plane = await API.getPlane(planeId);
      setPlane(plane);
      setNReserved(plane.reservedSeats.length);
      setNAvailable(plane.F * plane.P - plane.reservedSeats.length);
      setNRequested(0);
      setNewReservations([])

      let seatsObj = [];
      let seatsPerRow = ['A', 'B', 'C', 'D', 'F', 'G'].splice(0, plane.P);
      let rows = [];
      for (let i = 1; i <= plane.F; i++) {
        rows.push(i);
      }
      for (let r of rows) {
        for (let s of seatsPerRow) {
          seatsObj.push({ F: r, P: s });
        }
      }
      setSeats(seatsObj);
    };

    getPlane();
    setAskUpdate(false);
  }, [askUpdate]);

  useEffect(() => {
    if (plane && user) {
      for (let i = 0; i < plane.reservedSeats.length; i++) {
        if (plane.reservedSeats.some((it) => it.userId === user.id)) {
          setUserHasReserved(true);
          break;
        }
      }
    }
  }, [user, plane, setAskUpdate]);

  useEffect(() => {
    if (hasError) {
      const timeout = setTimeout(() => {
        setError(null);
        setHasError(false);
      }, 5000); // Set the duration in milliseconds (5 seconds in this example)
  
      return () => clearTimeout(timeout);
    }
  }, [hasError]);

  const reserveSeat = (seat) => {
    if (user && !userHasReserved) {
      const s = { planeId: plane.id, userId: user.id, F: seat.F, P: seat.P };
      const seatIndex = plane.reservedSeats.findIndex((it) => it.F === s.F && it.P === s.P);
      if (seatIndex !== -1)
        if (plane.reservedSeats[seatIndex].userId !== user.id)
          return;
      const reservationIndex = newReservations.findIndex((it) => it.F === s.F && it.P === s.P);
      if (reservationIndex !== -1) {
        setNewReservations((prevReservations) =>
          prevReservations.filter((reservation) => reservation.F !== s.F || reservation.P !== s.P)
        );
        setNAvailable(() => nAvailable + 1);
        setNReserved(() => nReserved - 1);
        setNRequested(() => nRequested - 1);
      }
      else {
        setNewReservations((prevReservations) => [...prevReservations, s]);
        setNAvailable(() => nAvailable - 1);
        setNReserved(() => nReserved + 1);
        setNRequested(() => nRequested + 1);
      }
      
      if (seatIndex !== -1)
        plane.reservedSeats.splice(seatIndex, 1);
      else
        plane.reservedSeats.push(s);
    }
  }

  const handleSubmit = async() => {
    if (!userHasReserved) {
      try {
        const result = await API.createReservation({ requested: newReservations });
        setNewReservations([]);
        setUserHasReserved(true);
      }
      catch (err) {
        setError(err);
        setHasError(true);
      }
    }
    else {
      await API.deleteReservation(plane.id, user.id);
      setUserHasReserved(false);
    }
    setAskUpdate(true);
  }

      function isErrorSeat(seat) {
        if (error && error.error) {
          return error.error.some((errorSeat) => errorSeat.F === seat.F && errorSeat.P === seat.P);
        }
        return false;
      }

  if (plane != undefined)
    return (
      <>
        <h1>Plane type: {plane.type}</h1>
        <h3>Total seats: {plane.F * plane.P}</h3>
        <h3>Reserved seats: {nReserved}</h3>
        <h3>Available seats: {nAvailable}</h3>
        <h3>Requested seats: {nRequested}</h3>
        <hr className="rounded"></hr>
        <Container fluid>
          <Row>
            <Col>
              <Container className="labels">
                <span className="label label-reserved">Reserved</span>
                <span className="label label-requested">Requested</span>
                <span className="label label-available">Available</span>
                <span className="label label-conflicting">Conflicting</span>
              </Container>
            </Col>
          </Row>
          {Array.from({ length: plane.F }, (_, rowIndex) => (
            <Row key={rowIndex}>
              {Array.from({ length: plane.P }, (_, colIndex) => {
                const seat = seats[rowIndex * plane.P + colIndex];
                return (
                  <Col
                    key={`${rowIndex}-${colIndex}`}
                    className={`seat ${hasError && isErrorSeat(seat) ? 'conflicting' : plane.reservedSeats.some((it) => it.F === seat.F && it.P === seat.P) ? (newReservations.some((it) => it.F === seat.F && it.P === seat.P) ? 'requested' : 'occupied') : 'available'}`}
                    onClick={() => reserveSeat(seat)}
                    disabled={userHasReserved}
                  >
                    {seat.F}{seat.P}
                  </Col>
                );
              })}
            </Row>
          ))}
        </Container>
        <hr className="rounded"></hr>
        { userHasReserved ? 
           user && <Button variant="danger" onClick={handleSubmit}>Cancel existing reservation</Button> : 
           user && <Button variant="success" disabled={nRequested === 0} onClick={handleSubmit}>Confirm reservation</Button>
        }
        { user && <Link to={`/planes/${planeId}/form`} relative='path' className='btn btn-info text'>Simple reservation form</Link> }
        <Link to='/' relative='path' className='btn btn-info text'>Back to all planes</Link>
        <hr className="rounded"></hr>
      </>
    );
  else
    return null;
}

export default PlaneView;
