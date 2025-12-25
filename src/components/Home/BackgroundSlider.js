import React from 'react';
import './CSS/BackgroundSlider.css';

const BackgroundSlider = () => {
    // Display only the first image (img1.jpg) - no slideshow
    return (
        <div className="background-slider">
            <div className="sliding-image">
                <img src={require(`./Images/voting-hero.jpg`)} alt="voting background" className="background-image" />
            </div>
            <div className="content">
            </div>
        </div>
    );
};
export default BackgroundSlider;
