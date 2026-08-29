import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://codequest-backend-zrh7.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
export default axiosClient;