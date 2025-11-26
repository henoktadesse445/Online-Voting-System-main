import { useState, useEffect, React, useRef} from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import UserNavbar from "../Navbar/UserNavbar";
import './CSS/user.css'
import UserCard from './Components/UserCard/userCard'
import UpcomingElections from './Components/UpcomingElections';
import ScrollReveal from "scrollreveal";
import { BASE_URL } from '../../helper';
import Cookies from 'js-cookie';

const User = () =>{
  const location = useLocation();
  const { voterst } = location.state || {};
  
  // Set cookie if voter state is passed from login
  useEffect(() => {
    if (voterst && voterst.id) {
      // Set cookie for 7 days
      Cookies.set('myCookie', voterst.id, { expires: 7 });
      console.log('Cookie set for voter:', voterst.id);
    }
  }, [voterst]);

  const voterid = Cookies.get('myCookie');
  const revealRefBottom = useRef(null);
  const revealRefLeft = useRef(null);  
  const revealRefTop = useRef(null);
  const revealRefRight = useRef(null);

  // Optimized: Single useEffect for all ScrollReveal animations
  useEffect(() => {
    // Initialize all ScrollReveal animations together for better performance
    const scrollRevealConfig = {
      duration: 600, // Reduced from 1000ms
      delay: 50, // Reduced from 200ms
      distance: '30px', // Reduced from 50px
      easing: 'ease',
      reset: false, // Changed from 'true' to false for better performance
    };

    if (revealRefBottom.current) {
      ScrollReveal().reveal(revealRefBottom.current, { ...scrollRevealConfig, origin: 'bottom' });
    }
    if (revealRefRight.current) {
      ScrollReveal().reveal(revealRefRight.current, { ...scrollRevealConfig, origin: 'right' });
    }
    if (revealRefLeft.current) {
      ScrollReveal().reveal(revealRefLeft.current, { ...scrollRevealConfig, origin: 'left' });
    }
    if (revealRefTop.current) {
      ScrollReveal().reveal(revealRefTop.current, { ...scrollRevealConfig, origin: 'top' });
    }
  }, []);  
  const [singleVoter, setVoter] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // If voter data is passed from login, use it immediately for faster display
      if (voterst && voterst.id && !voterid) {
        setIsLoading(false);
        return;
      }

      if (!voterid) {
        console.warn('No voter ID found in cookie');
        if (!voterst) {
          setError('Session not found. Please login again.');
        }
        setIsLoading(false);
        return;
      }
      
      axios.get(`${BASE_URL}/getVoterbyID/${voterid}`)
        .then((response) => {
          console.log(response.data)
          if (response.data.success) {
            setVoter(response.data.voter);
            setError(null);
          } else {
            setError(response.data.message || 'Failed to load voter information');
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          setError('Failed to load voter information. Please try logging in again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [voterid, voterst]); 
  
    return(
        <div className="User">
            <UserNavbar/>
            {error && (
                <div style={{ 
                    padding: '15px', 
                    margin: '20px auto', 
                    maxWidth: '600px',
                    backgroundColor: '#ffebee', 
                    border: '1px solid #f44336',
                    borderRadius: '5px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#c62828', margin: 0 }}>{error}</p>
                    <a href="/Login" style={{ color: '#1976d2', textDecoration: 'underline' }}>Click here to login</a>
                </div>
            )}
            <div className="Heading2" ref={revealRefTop}>
            <h3>Welcome <span>{singleVoter.firstName || singleVoter.name}</span></h3>
            </div>
            <div className="userPage" >
                <div className="userDetails" ref={revealRefLeft}>
                    <UserCard voter = {singleVoter}/>
                    {/* <UserUtil voterid = {voterst.id} /> */}
                </div>
                <div className='details' ref={revealRefRight}>
                    <h2> Welcome to <span>Online Voting Platform</span></h2>
                    <h6>Exercise Your Right to Vote Anytime, Anywhere</h6>
                    <p>Welcome to our online voting platform, where your voice matters. With the convenience of modern technology, we bring democracy to your fingertips, enabling you to participate in important decisions and elections from the comfort of your own home. Our secure and user-friendly platform ensures that your vote is counted accurately and confidentially. Whether it's electing your local representatives, deciding on community initiatives, or participating in organizational polls, our platform empowers you to make a difference.</p>
                </div>
            </div>
            <UpcomingElections voteStatus = {singleVoter.voteStatus}/>
        </div>
    )
}
export default User;