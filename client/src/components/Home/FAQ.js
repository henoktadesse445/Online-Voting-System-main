import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Typography from '@mui/material/Typography';
import './CSS/faq.css'
import { useEffect, useRef } from 'react';
import ScrollReveal from "scrollreveal";


export default function FAQ() {
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
        <div className='FAQ' id="faq">
            <h2 ref={revealRefTop}>Curious Mind Wants to Know</h2>
            <div className='Questions' ref={revealRefRight}>
                <Accordion className='accordian' >
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography className='heading'>How does it Work?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className='answer'>
                            Our online voting system is like magic, but legal. Simply cast your vote with a click!
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion className='accordian' >
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography className='heading'>Is it Secure?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className='answer'>
                            Yes, our platform uses robust security measures including encryption, secure authentication, and vote integrity verification to ensure your vote remains confidential and tamper-proof.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion className='accordian' >
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography className='heading'>Can I change my vote?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className='answer'>
                            Once you've voted, it's set in stone. Choose wisely, like your life depends on it!                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion className='accordian' >
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography className='heading'>Who is eligible to vote?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className='answer'>
                            Yes, if you're a student of WCU, congratulations, you're eligible to vote!
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion className='accordian' >
                    <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography className='heading'>What if I forget to vote?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography className='answer'>
                            If you miss the voting deadline, you will not be able to cast your vote for that particular election. We recommend setting reminders and checking election dates regularly to ensure you don't miss your opportunity to participate.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

            </div>
        </div>

    );
}
