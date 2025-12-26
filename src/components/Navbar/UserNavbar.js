import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './CSS/Nav.css'
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';



import { ColorModeContext } from '../NewDashboard/theme';
import { useContext } from 'react';
import { useTheme } from '@mui/material';

function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDark = theme.palette.mode === 'dark';

  const handleLogout = () => {
    // Save theme
    const currentTheme = localStorage.getItem("theme");

    // Clear session cookie
    Cookies.remove('myCookie');

    // Clear any other session data if needed
    localStorage.clear();
    sessionStorage.clear();

    // Restore theme
    if (currentTheme) {
      localStorage.setItem("theme", currentTheme);
    }

    // Redirect to login page
    navigate('/Login');
  };

  // Helper function to check if current path is active
  const isActive = (path) => location.pathname === path;

  return (
    <Navbar expand="lg" className="Nav">
      <Container fluid>
        <Navbar.Brand href="/User" className='Heading'>Online Voting System</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0 Nav-items-container"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
            <Nav.Link
              className={`Nav-items ${isActive('/User') ? 'active' : ''}`}
              href="/User"
            >
              Home
            </Nav.Link>

            <Nav.Link
              className={`Nav-items ${isActive('/Vote') ? 'active' : ''}`}
              href="/Vote"
            >
              Vote Now
            </Nav.Link>

            <Nav.Link
              className={`Nav-items ${isActive('/Results') ? 'active' : ''}`}
              href="/Results"
            >
              View Results
            </Nav.Link>

            <Nav.Link
              className={`Nav-items ${isActive('/registerCandidate') ? 'active' : ''}`}
              href="/registerCandidate"
            >
              Register as Candidate
            </Nav.Link>

            <Nav.Link
              className={`Nav-items ${isActive('/Edit') ? 'active' : ''}`}
              href="/Edit"
            >
              My Account
            </Nav.Link>
          </Nav>

          <Nav className="ml-auto">
            <Button
              variant={isDark ? 'outline-light' : 'outline-dark'}
              onClick={colorMode.toggleColorMode}
              size="sm"
              className="ThemeToggleButton"
              style={{
                marginLeft: '10px',
                borderColor: 'transparent',
                backgroundColor: 'transparent',
                color: isDark ? '#fff' : '#222'
              }}
            >
              {isDark ? <FaMoon /> : <FaSun />}
            </Button>
            <Button
              variant={isDark ? 'outline-light' : 'outline-primary'}
              onClick={handleLogout}
              style={{
                marginLeft: '10px',
                borderRadius: '0.5rem',
                fontWeight: '600'
              }}
            >
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default UserNavbar;
