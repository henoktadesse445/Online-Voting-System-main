import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './CSS/Nav.css'
import Cookies from 'js-cookie';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { FaMoon, FaSun, FaHome, FaVoteYea, FaPoll, FaIdCard, FaUserAlt } from 'react-icons/fa';
import { ColorModeContext } from '../NewDashboard/theme';
import { useTheme } from '@mui/material';

function UserNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const isDark = theme.palette.mode === 'dark';

    const [scrolled, setScrolled] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        const handleResize = () => {
            if (window.innerWidth > 991 && expanded) {
                setExpanded(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [expanded]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (expanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [expanded]);

    const handleLogout = () => {
        const currentTheme = localStorage.getItem("theme");
        Cookies.remove('myCookie');
        localStorage.clear();
        sessionStorage.clear();
        if (currentTheme) {
            localStorage.setItem("theme", currentTheme);
        }
        navigate('/Login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <Navbar
                expand="lg"
                expanded={expanded}
                className={`Nav sticky-top ${scrolled ? 'scrolled' : ''} ${expanded ? 'sidebar-open' : ''}`}
            >
                <Container fluid className="d-flex align-items-center justify-content-between px-0">
                    <Navbar.Brand as={Link} to="/User" className='Heading'>Online Voting System</Navbar.Brand>
                    <Navbar.Toggle
                        aria-controls="user-navbar-nav"
                        className='Toggle'
                        onClick={() => setExpanded(!expanded)}
                    />
                    <Navbar.Collapse id="user-navbar-nav">
                        <div className="sidebar-header d-lg-none">
                            <span className="sidebar-title">Menu</span>
                            <button className="btn-close btn-close-white" onClick={() => setExpanded(false)}></button>
                        </div>

                        <Nav
                            className="mx-auto my-2 my-lg-0 Nav-items-container"
                            style={{ maxHeight: '100px' }}
                            navbarScroll
                        >
                            <Nav.Link
                                as={Link}
                                to="/User"
                                className={`Nav-items ${isActive('/User') ? 'active' : ''}`}
                                onClick={() => setExpanded(false)}
                            >
                                <FaHome className="nav-icon d-lg-none" /> Home
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to="/Vote"
                                className={`Nav-items ${isActive('/Vote') ? 'active' : ''}`}
                                onClick={() => setExpanded(false)}
                            >
                                <FaVoteYea className="nav-icon d-lg-none" /> Vote Now
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to="/Results"
                                className={`Nav-items ${isActive('/Results') ? 'active' : ''}`}
                                onClick={() => setExpanded(false)}
                            >
                                <FaPoll className="nav-icon d-lg-none" /> View Results
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to="/registerCandidate"
                                className={`Nav-items ${isActive('/registerCandidate') ? 'active' : ''}`}
                                onClick={() => setExpanded(false)}
                            >
                                <FaIdCard className="nav-icon d-lg-none" /> Register as Candidate
                            </Nav.Link>

                            <Nav.Link
                                as={Link}
                                to="/Edit"
                                className={`Nav-items ${isActive('/Edit') ? 'active' : ''}`}
                                onClick={() => setExpanded(false)}
                            >
                                <FaUserAlt className="nav-icon d-lg-none" /> My Account
                            </Nav.Link>
                        </Nav>

                        <Nav className="align-items-center gap-2 menu-actions">
                            <Button
                                variant="link"
                                onClick={colorMode.toggleColorMode}
                                className="ThemeToggleButton text-decoration-none"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
                            </Button>
                            <Button
                                variant={isDark ? 'outline-light' : 'outline-primary'}
                                onClick={handleLogout}
                                className="LoginButton px-4 ms-lg-2"
                                style={{
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
            {expanded && <div className="navbar-backdrop" onClick={() => setExpanded(false)}></div>}
        </>
    );
}

export default UserNavbar;
