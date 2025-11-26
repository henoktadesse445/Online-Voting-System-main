import React, { useState, useEffect } from 'react';
import './CSS/BackgroundSlider.css';

const BackgroundSlider = () => {
    // Images to display (removed img3, img4, img5)
    const images = [1, 2, 6, 7, 8, 9];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(currentIndex => (currentIndex + 1) % images.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="background-slider">
            <div className="sliding-image">
                <img src= {require(`./Images/img${images[currentIndex]}.jpg`)} alt="noimage" className="background-image" />

            </div>
            <div className="content">
            </div>
        </div>
    );
};
export default BackgroundSlider;
