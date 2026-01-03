import './CSS/team.css'
import { useEffect, React, useRef } from 'react';
import ScrollReveal from "scrollreveal";
import image1 from './CSS/image1.jpg'
import image2 from './CSS/image2.jpg'
import image3 from './CSS/image3.jpg'
import image4 from './CSS/image4.jpg'

const Team = () => {
    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);

    useEffect(() => {


        ScrollReveal().reveal(revealRefBottom.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'bottom',
            easing: 'ease',
            reset: 'true',
        });
    }, []);
    useEffect(() => {


        ScrollReveal().reveal(revealRefRight.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'right',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefLeft.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'left',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefTop.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'top',
            easing: 'ease',
            reset: 'true',
        });
    }, []);
    return (
        <div className="Team">
            <h2 ref={revealRefTop}> Project Members</h2>
            <div className='Team-Content'>
                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image1} className='image' alt='Henok Tadesse'></img>
                    <h3>Henok Tadesse</h3>
                </div>

                <div className='Team-Content-Card' ref={revealRefRight}>
                    <img src={image2} className='image' alt='Habtamu Hailemichael'></img>
                    <h3>Habtamu Hailemichael</h3>
                </div>

                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image3} className='image' alt='Misgana Tumebo'></img>
                    <h3>Misgana Tumebo</h3>
                </div>

                <div className='Team-Content-Card' ref={revealRefRight}>
                    <img src={image4} className='image' alt='Feven Alemu'></img>
                    <h3>Feven Alemu</h3>
                </div>

            </div>
        </div>
    )
}
export default Team;