import axios from 'axios';

const baseURL = process.env.NODE_ENV === "production" ? 
    "https://api.basketpal.nilaymodi.com" :
    "http://localhost:8001";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
