import React, { useState } from 'react';
import './CSS/contact.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';


const Contact = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const sendingSuccess = (msg) => toast.success(msg, {
        className: "toast-message",
    });
    
    const sendingFailed = (msg) => toast.error(msg, {
        className: "toast-message",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        // Validate all fields
        if (!name || !email || !message) {
            sendingFailed("Please fill all the fields");
            setErrorMessage("Please fill all the fields");
            setLoading(false);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            sendingFailed("Please enter a valid email address");
            setErrorMessage("Please enter a valid email address");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/contact', {
                name,
                email,
                message
            });

            if (response.data.success) {
                setSuccessMessage(response.data.message);
                sendingSuccess(response.data.message);
                // Clear form
                setName('');
                setEmail('');
                setMessage('');
            } else {
                setErrorMessage(response.data.message || 'Failed to send message. Please try again.');
                sendingFailed(response.data.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            const errorMsg = error.response?.data?.message || 'There was an error sending your message. Please try again.';
            setErrorMessage(errorMsg);
            sendingFailed(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-form" id="contact">
            <h2>Contact Us</h2>
            <ToastContainer />
            <form>
                <div className='contact-field'>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder='Enter Your Name'
                    />
                </div>
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder='Enter Your Email'
                    />
                </div>
                <div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        placeholder='Enter Your Message'
                    />
                </div>
                <button onClick={handleSubmit} disabled={loading}>{loading ? <div className="spinner"></div> : 'Send'}</button>
            </form>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default Contact;
