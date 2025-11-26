import "./SignUtils/CSS/Sign.css"
import "./SignUtils/CSS/style.css.map"
import "./SignUtils/fonts/material-icon/css/material-design-iconic-font.min.css"
import signinimage from "./SignUtils/images/signin-image.jpg"
import { useState} from 'react';
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
    const [loading, setLoading] = useState(false);

    const loginSuccess = () => toast.success("Login Success",{
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const loginFailed = () => toast.error(`Invalid Details or User Doesn't exist`,{
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/login`, { username, password });
            const voterst = response.data.voterObject;
            if(response.data.success){
                loginSuccess();
                // Navigate immediately - removed 2 second delay for faster UX
                setTimeout(()=>{
                    navigate('/User', { state: { voterst } });
                }, 500); // Reduced to 500ms just to show success message
            }
            else{
                loginFailed();
            }
          } 
          catch (error) {
            console.error('Login failed:', error);
          }finally {
            setLoading(false);
          }
      
    };

    return (
        <div >
            <Nav_bar />
            <section className="sign-in">
                <div className="container">
                <p>Use your Student ID or Email and password to login</p>


                    <div className="signin-content">
                    
                        <div className="signin-image">
                            <figure><img src={signinimage} alt="sing up image" /></figure>
                            <Link to="/Signup" className="signup-image-link">Create an account</Link>
                        </div>

                        <div className="signin-form">
                            <h2 className="form-title">Sign In</h2>
                            {/* <form method="" className="register-form" id="login-form"> */}
                            <ToastContainer />
                                <div className="form-group">
                                    <label htmlFor="studentid"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                    <input type="text" name="studentid" id="studentid" placeholder="Enter Student ID or Email (e.g., WCU1234567 or yourname@gmail.com)" onChange={(e) => setUsername(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label for="pass"><i className="zmdi zmdi-lock"></i></label>
                                    <input type="password" name="pass" id="pass" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <div className="form-group form-button">
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
export default Login;