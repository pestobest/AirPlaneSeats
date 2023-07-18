import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Planes(props) {

  const {planes, user} = props;

  return (
    <>
      <h1>Available planes</h1>
      <Table striped>
        <thead>
          <tr>
            <th>Type</th>
            <th>Rows of seats</th>
            <th>Columns of seats</th>
          </tr>
        </thead>
        <tbody>
          {
            planes.map((p) => <PlaneRow plane={p} key={p.id} user={user}/>)
          }
        </tbody>
      </Table>
    </>    
  );
}

function PlaneRow(props) {

  return(
    <tr>
      <td>
        <Link to={`/planes/${props.plane.id}`}> {props.plane.type} </Link>
      </td>
      <td>
        <small>{props.plane.F}</small>
      </td>
      <td>
        <small>{props.plane.P}</small>
      </td>
    </tr>
  );
}

export default Planes;