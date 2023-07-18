import { Navbar, Container, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LoginButton, LogoutButton } from './AuthComponents';
import { BiSolidPlaneAlt } from 'react-icons/bi'

function NavHeader(props) {

  const handleSubmit = (event) => {
    event.preventDefault();
  }

  return (
    <Navbar bg="primary" variant="dark" fixed="top" className="navbar-padding">
      <Container fluid className="justify-content">
        <Link to='/'>
          <Navbar.Brand>
            <BiSolidPlaneAlt />
            Planes
          </Navbar.Brand>
        </Link>
        <Form className="my-2 my-lg-0 mx-auto d-sm-block" action="#" role="search" aria-label="Quick search" onSubmit={handleSubmit}/>
        <Navbar.Collapse>
          <Nav>
            <Navbar.Text className="mx-2">
              {props.user && props.user.name && `Welcome, ${props.user.name}!`}
            </Navbar.Text>
            {props.loggedIn ? <LogoutButton logout={props.logout}/> : <LoginButton/>}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavHeader;