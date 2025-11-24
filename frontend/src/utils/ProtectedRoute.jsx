import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children,allowed})=>{
    const {user,isLoggedIn} = useContext(AuthContext)

    if(!isLoggedIn) return <Navigate to="/login" replace/>
    if(!allowed.includes(user.role)) return <Navigate to ="/unauthorized" replace/>
    return children
}

export default ProtectedRoute