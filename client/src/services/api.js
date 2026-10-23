import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://hostelfix-api.onrender.com/api"
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default API;