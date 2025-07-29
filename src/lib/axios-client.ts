import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

const baseURL =
    process.env.NODE_ENV === "production"
        ? import.meta.env.VITE_PUBLIC_API_BASE_URL_PROD
        : import.meta.env.VITE_PUBLIC_API_BASE_URL_DEV;

const options = {
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, 
};

const axiosClient = axios.create(options);

const refreshAccessToken = async () => {
    try {
        const response = await axios.post(
            `${baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true } // Send refresh token cookie
        );
        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken); // Store the new access token
        return accessToken;
    } catch (error) {
        console.error("Failed to refresh access token:", error);
        throw error;
    }
};




axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {

         const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };


        if (error.response?.status === 401 && !originalRequest._retry) {

            originalRequest._retry = true; 

            try {
                const newAccessToken = await refreshAccessToken();

                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${newAccessToken}`,
                };
                return axiosClient(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                window.location.href = "/";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;

type ErrorResponse = {
    success: boolean;
    message: string;
    data?: unknown;
};

export type AxiosErrorResponse = AxiosError<ErrorResponse>;