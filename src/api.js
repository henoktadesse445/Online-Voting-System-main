import axios from "axios";

// Create a single axios instance to use across the app
const api = axios.create({
  baseURL: "http://localhost:5000", // your backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
