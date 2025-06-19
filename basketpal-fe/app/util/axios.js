import axios from 'axios';

const baseURL = process.env.NODE_ENV === "production" ? 
    "https://basketpal-be.onrender.com" : 
    "http://localhost:8001";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
