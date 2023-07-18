import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { Container, Row, Col } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import NavHeader from './components/NavbarComponents';
import { LoginForm } from './components/AuthComponents';
import Planes from './components/PlanesComponents';
import PlaneView from './components/PlaneViewComponents';
import ReservationForm from './components/ReservationFormComponents';
import NotFound from './components/NotFoundComponent';
import API from './API'

function App() {

  const [planes, setPlanes] = useState([]);
  const [askUpdate, setAskUpdate] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(()=> {
    const getPlanes = async () => {
      const planes = await API.getPlanes();
      setPlanes(planes);
    }
    getPlanes();
    setAskUpdate(false)
  }, [askUpdate]);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await API.getUserInfo();  // here you have the user info, if already logged in
        setUser(user);
        setLoggedIn(true);
      } catch (err) {
        setUser(null);
        setLoggedIn(false);
      }
    };
    init();
  }, []);  // This useEffect is called only the first time the component is mounted.

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      setAskUpdate(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setUser(null);
    setAskUpdate(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element = {
          <Container fluid className="App">
            <NavHeader logout={handleLogout} user={user} loggedIn={loggedIn}/>
            <Row className="vh-100">
              <Col md={12} className="below-nav">
                <Outlet/>
              </Col>
            </Row>
          </Container> }>
          <Route index
            element={ <Planes planes={planes} user={user} /> } /> 
          <Route path='/planes/:planeId/form' 
            element={ <ReservationForm askUpdate={askUpdate} setAskUpdate={setAskUpdate} user={user} />} />
          <Route path='/planes/:planeId' 
            element={ <PlaneView askUpdate={askUpdate} setAskUpdate={setAskUpdate} user={user} />} />
          <Route path="/login" element={
            <LoginForm login={handleLogin} /> } />
          <Route path='*' 
            element={ <NotFound/> } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
