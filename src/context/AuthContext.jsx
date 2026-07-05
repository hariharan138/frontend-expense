import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      axiosInstance
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const storeToken = (token, remember) => {
    if (remember) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
  };

  const login = async (email, password, remember = true) => {
    const { data } = await axiosInstance.post("/auth/login", { email, password });
    storeToken(data.token, remember);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axiosInstance.post("/auth/register", { name, email, password });
    storeToken(data.token, true);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

