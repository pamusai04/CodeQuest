import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'https://codequest-zw5i.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;

