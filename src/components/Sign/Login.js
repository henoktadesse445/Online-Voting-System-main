import "./SignUtils/CSS/Sign.css"
import "./SignUtils/CSS/style.css.map"
import "./SignUtils/fonts/material-icon/css/material-design-iconic-font.min.css"
import signinimage from "./SignUtils/images/signin-image.jpg"
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav_bar from "../Navbar/Navbar";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../../helper";


const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const loginSuccess = () => toast.success("Login Success", {
        className: "toast-message",
    });
    const loginFailed = (message) => toast.error(message || `Invalid Details or User Doesn't exist`, {
        className: "toast-message",
    });
    const otpSentSuccess = () => toast.success("OTP sent to your email. Please check your inbox.", {
        className: "toast-message",
    });

    // Handle login - supports password-only for returning users and OTP for first-time users
    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/login`, {
                username,
                password,
                otp: otp || undefined
            });

            if (response.data.success) {
                // Login successful - voterObject returned
                if (response.data.voterObject) {
                    const voterst = response.data.voterObject;
                    loginSuccess();
                    setTimeout(() => {
                        navigate('/User', { state: { voterst } });
                    }, 500);
                }
            } else {
                // Check if this is first-time login requiring OTP
                if (response.data.isFirstTimeLogin) {
                    loginFailed(response.data.message + " (First-time users need OTP)");
                } else {
                    loginFailed(response.data.message);
                }
            }
        } catch (error) {
            console.error('Login failed:', error);
            loginFailed(error.response?.data?.message || "Error during login");
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!username || !password) {
            loginFailed("Please enter both username and password");
            return;
        }
        await handleLogin();
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/verifyOTP`, { username, otp });

            if (response.data.success) {
                const voterst = response.data.voterObject;
                loginSuccess();
                setTimeout(() => {
                    navigate('/User', { state: { voterst } });
                }, 500);
            } else {
                loginFailed(response.data.message);
            }
        } catch (error) {
            console.error('OTP verification failed:', error);
            loginFailed(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/resendOTP`, { username });

            if (response.data.success) {
                toast.success("New OTP sent to your email", {
                    className: "toast-message",
                });
            } else {
                loginFailed(response.data.message);
            }
        } catch (error) {
            console.error('Resend OTP failed:', error);
            loginFailed(error.response?.data?.message || "Error resending OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div >
            <Nav_bar />
            <section className="sign-in">
                <div className="container">
                    <p>Login with your Student ID or Email and password</p>

                    <div className="signin-content">

                        <div className="signin-image">
                            <figure><img src={signinimage} alt="sign in image" /></figure>
                            {/* Registration links removed - User registration disabled */}
                        </div>

                        <div className="signin-form">
                            <h2 className="form-title">Sign In</h2>
                            <ToastContainer />

                            {!otpSent ? (
                                // Login form
                                <>
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="studentid"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                            <input
                                                type="text"
                                                name="studentid"
                                                id="studentid"
                                                placeholder="Student ID or Email (e.g., WCU1234567)"
                                                onChange={(e) => setUsername(e.target.value)}
                                                value={username}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="pass"><i className="zmdi zmdi-lock"></i></label>
                                            <input
                                                type="password"
                                                name="pass"
                                                id="pass"
                                                placeholder="Password"
                                                onChange={(e) => setPassword(e.target.value)}
                                                value={password}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="otp"><i className="zmdi zmdi-key"></i></label>
                                            <input
                                                type="text"
                                                name="otp"
                                                id="otp"
                                                placeholder="OTP (first-time login only)"
                                                onChange={(e) => setOtp(e.target.value)}
                                                value={otp}
                                                maxLength="6"
                                            />
                                        </div>
                                        <div className="form-group form-button">
                                            <button type="submit" disabled={loading}>
                                                {loading ? <div className="spinner"></div> : 'Login'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                // Step 2: Enter OTP
                                <>
                                    <p style={{ marginBottom: '15px', color: '#666' }}>
                                        OTP sent to: <strong>{userEmail}</strong>
                                    </p>
                                    <div className="form-group">
                                        <label htmlFor="otp"><i className="zmdi zmdi-key"></i></label>
                                        <input
                                            type="text"
                                            name="otp"
                                            id="otp"
                                            placeholder="Enter 6-digit OTP"
                                            onChange={(e) => setOtp(e.target.value)}
                                            value={otp}
                                            maxLength="6"
                                        />
                                    </div>
                                    <div className="form-group form-button">
                                        <button onClick={handleVerifyOTP} disabled={loading}>
                                            {loading ? <div className="spinner"></div> : 'Verify OTP'}
                                        </button>
                                    </div>
                                    <div className="form-group" style={{ textAlign: 'center', marginTop: '10px' }}>
                                        <button
                                            onClick={handleResendOTP}
                                            disabled={loading}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#3498db',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Resend OTP
                                        </button>
                                        <span style={{ margin: '0 10px' }}>|</span>
                                        <button
                                            onClick={() => { setOtpSent(false); setOtp(''); }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#3498db',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Change Credentials
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

        </div>

    )
}
export default Login;
