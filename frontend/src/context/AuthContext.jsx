import { createContext, useState, useEffect } from "react";
import axios from 'axios'
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext()

const AuthProviderInner = ({ children }) => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/check-auth`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsLoggedIn(true);

      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    setUser(userData)
    setIsLoggedIn(true)
  }

  const logOut = async () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const AuthProvider = ({ children }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>
}
