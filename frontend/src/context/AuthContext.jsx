import { createContext,useState,useEffect } from "react";
import axios from 'axios'

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{
    const [isLoggedIn,setIsLoggedIn] = useState(false)
    const [user,setUser] = useState(null)
    const API_URL = import.meta.env.VITE_API_URL

    useEffect(()=>{
        const checkAuth = async()=>{
            try {
                const res = await axios.get(`${API_URL}/auth/me`,{withCredentials:true})
                localStorage.setItem("user",JSON.stringify(res.data.user))
                setUser(res.data.user)
                setIsLoggedIn(true)

            } catch (error) {
                localStorage.removeItem("user")
                setIsLoggedIn(false)
                setUser(null)
            }
        }
        checkAuth()
    },[])


    const login = (userData)=>{
        localStorage.setItem("user",JSON.stringify(userData))
        setUser(userData)
        setIsLoggedIn(true)
    }
    
    const logOut = async () => {
        try {
            
            await axios.post(`${API_URL}/api/v1/auth/logout`, {}, {
                withCredentials: true
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            
            localStorage.removeItem("user")
            setUser(null)
            setIsLoggedIn(false)
            
            window.location.href = '/'
        }
    }

    return (
        <AuthContext.Provider value={{isLoggedIn,user,login,logOut}}>
            {children}
        </AuthContext.Provider>
    )
}

