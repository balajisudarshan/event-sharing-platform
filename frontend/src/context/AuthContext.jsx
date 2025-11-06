import { createContext,useState,useEffect } from "react";
import axios from 'axios'

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{
    const [isLoggedIn,setIsLoggedIn] = useState(false)
    const [user,setUser] = useState(null)
    const API_URL = import.meta.env.VITE_API_URL

    useEffect(()=>{
        const storedUser = localStorage.getItem("user")

        if(storedUser){
            setUser(JSON.parse(storedUser))
            setIsLoggedIn(true)
        }
    },[])


    const login = (userData)=>{
        localStorage.setItem("user",JSON.stringify(userData))
        setUser(userData)
        setIsLoggedIn(true)
    }
    
    const logOut = async () => {
        try {
            // Call backend logout API to clear the cookie
            await axios.post(`${API_URL}/api/v1/auth/logout`, {}, {
                withCredentials: true
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear local state regardless of API call success
            localStorage.removeItem("user")
            setUser(null)
            setIsLoggedIn(false)
            // Redirect to home page
            window.location.href = '/'
        }
    }

    return (
        <AuthContext.Provider value={{isLoggedIn,user,login,logOut}}>
            {children}
        </AuthContext.Provider>
    )
}

