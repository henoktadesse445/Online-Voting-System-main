import "./SignUtils/CSS/Sign.css"
import "./SignUtils/CSS/style.css.map"
// import "./SignUtils/fonts/material-icon/css/material-design-iconic-font.min.css"
import signinimage from "./SignUtils/images/adminbanner.png"
import { useState } from 'react';
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../../helper";


const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const loginSuccess = () => toast.success("Login Success", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const loginFailed = (message) => toast.error(`${message || "Invalid Details \n Please Try Again!"}`, {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });

    const handleLogin = async () => {
        setLoading(true);

        try {
            const response = await axios.post(`${BASE_URL}/adminlogin`, { username, password });

            if (response.data.success) {
                // Store admin session data
                const adminData = response.data.adminObject || {
                    _id: "6766786c4f039103c8120e98",
                    username: username,
                    role: "admin"
                };

                console.log("💾 Saving admin data to localStorage:", adminData);
                localStorage.setItem('currentUser', JSON.stringify(adminData));

                // Verify it was saved
                const saved = localStorage.getItem('currentUser');
                console.log("✅ Verified localStorage save:", saved);

                loginSuccess();
                setTimeout(() => {
                    navigate('/Admin');
                }, 2000)
            }
            else {
                loginFailed(response.data.message || "Invalid admin credentials");
            }
        }
        catch (error) {
            console.error('Login failed:', error);
            if (error.response && error.response.data && error.response.data.message) {
                loginFailed(error.response.data.message);
            } else if (error.message) {
                loginFailed(error.message);
            } else {
                loginFailed("Network error. Please check if the server is running.");
            }
        } finally {
            setLoading(false);
        }

    };

    return (
        <div >
            <Navbar />
            <section className="sign-in">
                <div className="container">
                    <div className="signin-content">

                        <div className="signin-image">
                            <figure><img src={signinimage} alt="sing up image" /></figure>
                        </div>

                        <div className="signin-form">
                            <h2 className="form-title">Admin Login</h2>
                            {/* <form method="" className="register-form" id="login-form"> */}
                            <ToastContainer />
                            <div className="form-group">
                                <label for="email"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                <input type="text" name="email" id="email" placeholder="Enter Admin Username" onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label for="pass"><i className="zmdi zmdi-lock"></i></label>
                                <input type="password" name="pass" id="pass" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <div className="form-group form-button">
                                {/* <input type="submit" name="signin" id="signin" className="form-submit" value="Log in" onSubmit={handleLogin} /> */}
                                <button onClick={handleLogin} disabled={loading}>{loading ? <div className="spinner"></div> : 'Login'}</button>

                            </div>

                            {/* </form> */}
                        </div>
                    </div>

                </div>
            </section>

        </div>

    )
}
export default AdminLogin;