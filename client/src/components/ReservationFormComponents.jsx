import { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Reservation } from '../planeModels.js';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../API';
import './PlaneViewCSS.css';

function PlaneForm(props) {

  const navigate = useNavigate();
  const { askUpdate, setAskUpdate, user } = props;
  const [plane, setPlane] = useState();
  const [nReserved, setNReserved] = useState();
  const [nAvailable, setNAvailable] = useState();
  const [nRequested, setNRequested] = useState(1);
  const [userHasReserved, setUserHasReserved] = useState(false);
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { planeId } = useParams();

  useEffect(() => {
    const getPlane = async () => {
      const plane = await API.getPlane(planeId);
      setPlane(plane);
    }
    getPlane();
    setAskUpdate(false);
  }, [askUpdate]);

  useEffect(() => {
    if (plane && user)
      for (let i = 0; i < plane.reservedSeats.length; i++)
        if (plane.reservedSeats.some(it => it.userId === user.id))
          setUserHasReserved(true);
  }, [user, plane]);

  useEffect(() => {
    if (plane && plane.reservedSeats) {
      setNReserved(plane.reservedSeats.length);
      setNAvailable(plane.F * plane.P - plane.reservedSeats.length);
    }
  }, [plane]);  

  const handleSubmit = async (event) => {
    event.preventDefault();
      if (!userHasReserved) {
      let newReservations = [];
      let seatsPerRow = ['A', 'B', 'C', 'D', 'F', 'G'].splice(0, plane.P);
      let rows = [];
      for (let i = 1; i <= plane.F; i++)
        rows.push(i);
      let i = 0, end = false;

      for (let r of rows) {
        for (let s of seatsPerRow) {
          if (!plane.reservedSeats.some(it => it.planeId === plane.id && it.F === r && it.P === s)) {
            newReservations.push({ planeId: plane.id, userId: user.id, F: r, P: s });
            plane.reservedSeats.push({ planeId: plane.id, userId: user.id, F: r, P: s });
            i++;
          }
          if (i == nRequested) {
            end = true;
            break;
          }
        }
        if (end)
          break;
      }
      await API.createReservation({ requested: newReservations })
        .catch((err) => { 
          setErrorMessage("Some other seats have been taken. Choose a lower number of seats.");
          setShow(true); 
          console.log(err);
          setAskUpdate(true);
        });
    }
    else {
      await API.deleteReservation(plane.id, user.id)
        .then(() => setUserHasReserved(false));
    }
    setAskUpdate(true);
    navigate(`./..`);
  }

  if (plane != undefined)
    return (
      <>
        <h1>Plane type: {plane.type}</h1>
        <h3>Total seats: {plane.F * plane.P}</h3>
        <h3>Reserved seats: {nReserved}</h3>
        <h3>Available seats: {nAvailable}</h3>
        <hr className="rounded"></hr>
        <h3>Reservation</h3>
        <Form onSubmit={handleSubmit}>
          <Alert
            dismissible
            show={show}
            onClose={() => setShow(false)}
            variant="danger">
            {errorMessage}
          </Alert>
          <Form.Group as={Row} className='mb-3' controlId="formHorizontalPassword">
            <Form.Label column sm={4}>Number of seats to be reserved</Form.Label>
            <Col sm={8}>
              <Form.Control type="number" minLength={1} max={nAvailable} min={1} required={true} value={nRequested} disabled={userHasReserved} onChange={(event) => setNRequested(event.target.value)}></Form.Control>
            </Col>
          </Form.Group>
          <hr className="rounded"></hr>
          { userHasReserved ? 
            <Button variant="danger" type="submit" disabled={user == null}>Cancel existing reservation</Button> : 
            <Button variant="success" type="submit" disabled={user == null}>Confirm reservation</Button>
          }
          <Link to={`/planes/${planeId}`} relative='path' className='btn btn-info text'>Graphical UI</Link>
          <Link to='/' relative='path' className='btn btn-info text'>Back to all planes</Link>
        </Form>
      </>
    );
}

export default PlaneForm;
