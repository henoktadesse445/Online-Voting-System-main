import { useEffect, React, useRef} from 'react';
import ScrollReveal from "scrollreveal";
import { useNavigate } from 'react-router-dom';

import "../CSS/upcomingElections.css"
const UpcomingElections = ({voteStatus})=>{
    const navigate = useNavigate();
   
    // const handleButtonClick = () => {
    //     if (voteStatus) {
    //         alert("You Have Already Voted");
    //     } else {
    //         navigate('/Vote')
    //     }
    //   };
    
    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);  
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);
  
    useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefBottom.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'bottom',
        easing: 'ease',
        reset: 'true',
      });
    }, []);
    useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefRight.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'right',
        easing: 'ease',
        reset: 'true',
      });
    }, []);  useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefLeft.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'left',
        easing: 'ease',
        reset: 'true',
      });
    }, []);  useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefTop.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'top',
        easing: 'ease',
        reset: 'true',
      });
    }, []); 
    return(
        <div className="upcomingElections">
            <h2 ref={revealRefTop}>Upcoming Elections</h2>
 
            <div className="upcomingElectionsCardContainer">
                <div className="upcomingElectionCard" ref={revealRefLeft}>
                    <h3>WCU Student President Election</h3><br/>
                    <p>Vote to elect the Wachemo University Student President. Ensure you are registered and eligible to participate in this campus election.</p><br/>
                    <button><a href='/Vote'>Participate/Vote</a></button>
                </div>

            </div>
        </div>
    )
}
export default UpcomingElections;