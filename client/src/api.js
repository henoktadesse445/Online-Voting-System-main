import axios from "axios";

// Create a single axios instance to use across the app
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000", // your backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
