import React, { useState, useEffect } from 'react'
import axios from 'axios'

const RegisterButton = ({ eventId }) => {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user"))
  const userId = user?._id

  useEffect(() => {
    const checkUserRegistered = async () => {
      console.log("CHECKING FOR USER:", userId)

      try {
        const res = await axios.get(
          `${API_URL}/registrations/users/${userId}/registrations`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        console.log("REGISTRATION API RESULT:", res.data)

        const already = res.data.registrations.some(
          reg => reg.event._id === eventId
        )

        setRegistered(already)

      } catch (error) {
        console.log("CHECK ERROR:", error)
      }
    }

    if (userId) checkUserRegistered()
  }, [eventId, userId])
  

  const handleRegister = async () => {
    setLoading(true)

    try {
      const res = await axios.post(
        `${API_URL}/registrations/events/${eventId}/register`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log("REGISTER SUCCESS:", res.data)
      setRegistered(true)

    } catch (error) {
      console.log("REGISTER ERROR:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      className="btn btn-outline btn-primary btn-sm" 
      onClick={handleRegister}
      disabled={registered || loading}
    >
      {registered ? "Registered" : loading ? "Registering..." : "Register"}
    </button>
  )
}

export default RegisterButton
