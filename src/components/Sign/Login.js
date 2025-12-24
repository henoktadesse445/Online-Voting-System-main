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
    const [credential, setCredential] = useState('');
    const [loading, setLoading] = useState(false);

    // Password change modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userId, setUserId] = useState('');
    const [userInfo, setUserInfo] = useState({});
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');

    // Forgot password modal state
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Enter username, 2: Enter OTP, 3: Set new password
    const [resetUsername, setResetUsername] = useState('');
    const [resetOTP, setResetOTP] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [resetUserId, setResetUserId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetPasswordStrength, setResetPasswordStrength] = useState('');

    const loginSuccess = () => toast.success("Login Success", {
        className: "toast-message",
    });
    const loginFailed = (message) => toast.error(message || `Invalid Details or User Doesn't exist`, {
        className: "toast-message",
    });

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        if (!password) return '';

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
        const length = password.length;

        if (length >= 12 && hasUpper && hasLower && hasNumber && hasSpecial) {
            return 'strong';
        } else if (length >= 10 && hasUpper && hasLower && hasNumber && hasSpecial) {
            return 'medium';
        } else if (length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) {
            return 'weak';
        } else {
            return 'invalid';
        }
    };

    // Handle login
    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/login`, {
                username,
                credential
            });

            if (response.data.success) {
                // Check if password change is required (first-time user)
                if (response.data.requiresPasswordChange) {
                    setUserId(response.data.userId);
                    setUserInfo(response.data.userInfo);
                    setShowPasswordModal(true);
                    toast.info("Please set a new password to continue", {
                        className: "toast-message",
                    });
                } else {
                    // Login successful - voterObject returned
                    const voterst = response.data.voterObject;
                    loginSuccess();
                    setTimeout(() => {
                        navigate('/User', { state: { voterst } });
                    }, 500);
                }
            } else {
                loginFailed(response.data.message);
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
        if (!username || !credential) {
            loginFailed("Please enter both username and OTP/password");
            return;
        }
        await handleLogin();
    };

    // Handle password change
    const handleSetPassword = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields", {
                className: "toast-message",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match", {
                className: "toast-message",
            });
            return;
        }

        const strength = calculatePasswordStrength(newPassword);
        if (strength === 'invalid') {
            toast.error("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character", {
                className: "toast-message",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/setPassword`, {
                userId,
                newPassword,
                confirmPassword
            });

            if (response.data.success) {
                const voterst = response.data.voterObject;
                toast.success("Password set successfully!", {
                    className: "toast-message",
                });
                setShowPasswordModal(false);
                setTimeout(() => {
                    navigate('/User', { state: { voterst } });
                }, 500);
            } else {
                toast.error(response.data.message, {
                    className: "toast-message",
                });
            }
        } catch (error) {
            console.error('Password change failed:', error);
            toast.error(error.response?.data?.message || "Error setting password", {
                className: "toast-message",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle password input change with strength calculation
    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        setPasswordStrength(calculatePasswordStrength(password));
    };

    // Forgot Password Handlers
    const handleRequestPasswordReset = async (e) => {
        e.preventDefault();
        if (!resetUsername) {
            toast.error("Please enter your Student ID", {
                className: "toast-message",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/requestPasswordReset`, {
                username: resetUsername
            });

            if (response.data.success) {
                setMaskedEmail(response.data.email);
                setResetStep(2);
                toast.success(response.data.message, {
                    className: "toast-message",
                });
            } else {
                toast.error(response.data.message, {
                    className: "toast-message",
                });
            }
        } catch (error) {
            console.error('Request password reset failed:', error);
            toast.error(error.response?.data?.message || "Error requesting password reset", {
                className: "toast-message",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyResetOTP = async (e) => {
        e.preventDefault();
        if (!resetOTP) {
            toast.error("Please enter the OTP", {
                className: "toast-message",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/verifyResetOTP`, {
                username: resetUsername,
                otp: resetOTP
            });

            if (response.data.success) {
                setResetToken(response.data.resetToken);
                setResetUserId(response.data.userId);
                setResetStep(3);
                toast.success(response.data.message, {
                    className: "toast-message",
                });
            } else {
                toast.error(response.data.message, {
                    className: "toast-message",
                });
            }
        } catch (error) {
            console.error('Verify reset OTP failed:', error);
            toast.error(error.response?.data?.message || "Error verifying OTP", {
                className: "toast-message",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!resetNewPassword || !resetConfirmPassword) {
            toast.error("Please fill in all password fields", {
                className: "toast-message",
            });
            return;
        }

        if (resetNewPassword !== resetConfirmPassword) {
            toast.error("Passwords do not match", {
                className: "toast-message",
            });
            return;
        }

        const strength = calculatePasswordStrength(resetNewPassword);
        if (strength === 'invalid') {
            toast.error("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character", {
                className: "toast-message",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/resetPassword`, {
                userId: resetUserId,
                resetToken: resetToken,
                newPassword: resetNewPassword,
                confirmPassword: resetConfirmPassword
            });

            if (response.data.success) {
                toast.success(response.data.message, {
                    className: "toast-message",
                });
                // Reset all forgot password states
                setShowForgotPasswordModal(false);
                setResetStep(1);
                setResetUsername('');
                setResetOTP('');
                setResetToken('');
                setResetUserId('');
                setMaskedEmail('');
                setResetNewPassword('');
                setResetConfirmPassword('');
                setResetPasswordStrength('');
            } else {
                toast.error(response.data.message, {
                    className: "toast-message",
                });
            }
        } catch (error) {
            console.error('Reset password failed:', error);
            toast.error(error.response?.data?.message || "Error resetting password", {
                className: "toast-message",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordChange = (e) => {
        const password = e.target.value;
        setResetNewPassword(password);
        setResetPasswordStrength(calculatePasswordStrength(password));
    };

    const handleResendResetOTP = async () => {
        await handleRequestPasswordReset({ preventDefault: () => { } });
    };

    return (
        <div >
            <Nav_bar />
            <section className="sign-in">
                <div className="container">
                    <p>Login with your Student ID or Email and OTP/Password</p>

                    <div className="signin-content">

                        <div className="signin-image">
                            <figure><img src={signinimage} alt="sign in image" /></figure>
                        </div>

                        <div className="signin-form">
                            <h2 className="form-title">Sign In</h2>
                            <ToastContainer />

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
                                    <label htmlFor="credential"><i className="zmdi zmdi-lock"></i></label>
                                    <input
                                        type="password"
                                        name="credential"
                                        id="credential"
                                        placeholder="Enter OTP or Password"
                                        onChange={(e) => setCredential(e.target.value)}
                                        value={credential}
                                        required
                                    />
                                </div>
                                <div className="form-group form-button">
                                    <button type="submit" disabled={loading}>
                                        {loading ? <div className="spinner"></div> : 'Login'}
                                    </button>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPasswordModal(true)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#3498db',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Set Your Password</h2>
                        <p className="modal-subtitle">
                            Welcome, <strong>{userInfo.name}</strong>! Please set a secure password for your account.
                        </p>

                        <form onSubmit={handleSetPassword}>
                            <div className="form-group">
                                <label htmlFor="newPassword">
                                    <i className="zmdi zmdi-lock-outline"></i>
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    id="newPassword"
                                    placeholder="New Password"
                                    onChange={handlePasswordChange}
                                    value={newPassword}
                                    required
                                />
                            </div>

                            {/* Password Strength Indicator */}
                            {newPassword && (
                                <div className={`password-strength ${passwordStrength}`}>
                                    <div className="strength-bar"></div>
                                    <span className="strength-text">
                                        {passwordStrength === 'strong' && 'Strong Password ✓'}
                                        {passwordStrength === 'medium' && 'Medium Strength'}
                                        {passwordStrength === 'weak' && 'Weak Password'}
                                        {passwordStrength === 'invalid' && 'Does not meet requirements'}
                                    </span>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    <i className="zmdi zmdi-lock"></i>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    placeholder="Confirm Password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    value={confirmPassword}
                                    required
                                />
                            </div>

                            {/* Password Requirements */}
                            <div className="password-requirements">
                                <p><strong>Password must contain:</strong></p>
                                <ul>
                                    <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>
                                        At least one uppercase letter (A-Z)
                                    </li>
                                    <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>
                                        At least one lowercase letter (a-z)
                                    </li>
                                    <li className={/\d/.test(newPassword) ? 'valid' : ''}>
                                        At least one number (0-9)
                                    </li>
                                    <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword) ? 'valid' : ''}>
                                        At least one special character (!@#$%^&*)
                                    </li>
                                    <li className={newPassword.length >= 8 ? 'valid' : ''}>
                                        Minimum 8 characters
                                    </li>
                                </ul>
                            </div>

                            <div className="form-group form-button">
                                <button type="submit" disabled={loading}>
                                    {loading ? <div className="spinner"></div> : 'Set Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {resetStep === 1 && (
                            <>
                                <h2 className="modal-title">Forgot Password?</h2>
                                <p className="modal-subtitle">
                                    Enter your Student ID and we'll send a password reset OTP to your registered email.
                                </p>

                                <form onSubmit={handleRequestPasswordReset}>
                                    <div className="form-group">
                                        <label htmlFor="resetUsername">
                                            <i className="zmdi zmdi-account"></i>
                                        </label>
                                        <input
                                            type="text"
                                            name="resetUsername"
                                            id="resetUsername"
                                            placeholder="Student ID (e.g., WCU1234567)"
                                            onChange={(e) => setResetUsername(e.target.value)}
                                            value={resetUsername}
                                            required
                                        />
                                    </div>

                                    <div className="form-group form-button">
                                        <button type="submit" disabled={loading}>
                                            {loading ? <div className="spinner"></div> : 'Send OTP'}
                                        </button>
                                    </div>

                                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPasswordModal(false);
                                                setResetStep(1);
                                                setResetUsername('');
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#666',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {resetStep === 2 && (
                            <>
                                <h2 className="modal-title">Verify OTP</h2>
                                <p className="modal-subtitle">
                                    OTP sent to: <strong>{maskedEmail}</strong>
                                </p>

                                <form onSubmit={handleVerifyResetOTP}>
                                    <div className="form-group">
                                        <label htmlFor="resetOTP">
                                            <i className="zmdi zmdi-key"></i>
                                        </label>
                                        <input
                                            type="text"
                                            name="resetOTP"
                                            id="resetOTP"
                                            placeholder="Enter 6-digit OTP"
                                            onChange={(e) => setResetOTP(e.target.value)}
                                            value={resetOTP}
                                            maxLength="6"
                                            required
                                        />
                                    </div>

                                    <div className="form-group form-button">
                                        <button type="submit" disabled={loading}>
                                            {loading ? <div className="spinner"></div> : 'Verify OTP'}
                                        </button>
                                    </div>

                                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={handleResendResetOTP}
                                            disabled={loading}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#3498db',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Resend OTP
                                        </button>
                                        <span style={{ margin: '0 10px' }}>|</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResetStep(1);
                                                setResetOTP('');
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#666',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Change Student ID
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {resetStep === 3 && (
                            <>
                                <h2 className="modal-title">Set New Password</h2>
                                <p className="modal-subtitle">
                                    Create a strong password for your account.
                                </p>

                                <form onSubmit={handleResetPassword}>
                                    <div className="form-group">
                                        <label htmlFor="resetNewPassword">
                                            <i className="zmdi zmdi-lock-outline"></i>
                                        </label>
                                        <input
                                            type="password"
                                            name="resetNewPassword"
                                            id="resetNewPassword"
                                            placeholder="New Password"
                                            onChange={handleResetPasswordChange}
                                            value={resetNewPassword}
                                            required
                                        />
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {resetNewPassword && (
                                        <div className={`password-strength ${resetPasswordStrength}`}>
                                            <div className="strength-bar"></div>
                                            <span className="strength-text">
                                                {resetPasswordStrength === 'strong' && 'Strong Password ✓'}
                                                {resetPasswordStrength === 'medium' && 'Medium Strength'}
                                                {resetPasswordStrength === 'weak' && 'Weak Password'}
                                                {resetPasswordStrength === 'invalid' && 'Does not meet requirements'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="resetConfirmPassword">
                                            <i className="zmdi zmdi-lock"></i>
                                        </label>
                                        <input
                                            type="password"
                                            name="resetConfirmPassword"
                                            id="resetConfirmPassword"
                                            placeholder="Confirm Password"
                                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                                            value={resetConfirmPassword}
                                            required
                                        />
                                    </div>

                                    {/* Password Requirements */}
                                    <div className="password-requirements">
                                        <p><strong>Password must contain:</strong></p>
                                        <ul>
                                            <li className={/[A-Z]/.test(resetNewPassword) ? 'valid' : ''}>
                                                At least one uppercase letter (A-Z)
                                            </li>
                                            <li className={/[a-z]/.test(resetNewPassword) ? 'valid' : ''}>
                                                At least one lowercase letter (a-z)
                                            </li>
                                            <li className={/\d/.test(resetNewPassword) ? 'valid' : ''}>
                                                At least one number (0-9)
                                            </li>
                                            <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(resetNewPassword) ? 'valid' : ''}>
                                                At least one special character (!@#$%^&*)
                                            </li>
                                            <li className={resetNewPassword.length >= 8 ? 'valid' : ''}>
                                                Minimum 8 characters
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="form-group form-button">
                                        <button type="submit" disabled={loading}>
                                            {loading ? <div className="spinner"></div> : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>

    )
}
export default Login;
