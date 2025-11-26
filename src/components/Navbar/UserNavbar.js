import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import './CSS/Nav.css'
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
 


function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored !== 'light' : true;
  });

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleLogout = () => {
    // Clear session cookie
    Cookies.remove('myCookie');
    
    // Clear any other session data if needed
    localStorage.clear();
    sessionStorage.clear();
    
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

            <NavDropdown 
              title="My Account" 
              id="account-dropdown" 
              className="Nav-items"
            >
              <NavDropdown.Item href="/User">Profile</NavDropdown.Item>
              <NavDropdown.Item href="/Edit">Edit Profile</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Logout
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link 
              className="Nav-items" 
              href="/"
            >
              About System
            </Nav.Link>
          </Nav>

          <Nav className="ml-auto">
            <Button 
              variant={isDark ? 'outline-light' : 'outline-dark'} 
              onClick={toggleTheme}
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
              variant="outline-light" 
              onClick={handleLogout}
              style={{ 
                marginLeft: '10px',
                borderColor: '#fff',
                color: '#fff'
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
