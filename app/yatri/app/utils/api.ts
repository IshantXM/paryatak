import axios from "axios";

export const API = axios.create({
  baseURL: "http://YOUR_IP:5000", // ⚠️ replace with your IP
});