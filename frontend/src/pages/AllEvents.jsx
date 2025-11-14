import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from '../Modal'
import { useNavigate } from '@tanstack/react-router'

const API_URL = import.meta.env.VITE_API_URL

const AllEvents = () => {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState([])
  const [showPopUp, setShowPopUp] = useState(false)
  const [deleteEventId,setDeleteEventId] = useState(null)
  const navigate = useNavigate()
  const handleDelete = async (eventId) => {
    const token = localStorage.getItem("token")
    try {
      const deleted = await axios.delete(`${API_URL}/events/${eventId}`,{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      if (deleted) {
        setEvents(prev => prev.filter(ev => ev._id !== eventId))
        alert("Event deleted successfully")
      } else {
        alert("An error occured")
      }
    } catch (error) {
      // alert(error)
      console.log(error)
    }
  }
  useEffect(() => {
    const token = localStorage.getItem("token")
    const fetchEvents = async () => {
       try {
        setIsLoading(true)
        setError('')
        const res = await axios.get(`${API_URL}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log(res.data.data)
        setEvents(res.data.data || [])
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
        console.log(JSON.parse(storedUser))
      } catch (err) {
        console.error('Error fetching events:', err)
        setError(err.response?.data?.message || 'Failed to load events. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70 text-lg">Loading events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="alert alert-error shadow-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            All Events
          </h1>
          <p className="text-base-content/70 text-lg">
            Discover and explore upcoming events
          </p>
        </div>


        {events.length === 0 ? (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xl text-base-content/70 font-semibold">No events available</p>
            <p className="text-base-content/50 mt-2">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((item) => (
              <div
                key={item._id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-base-300 overflow-hidden group relative"
              >
                {/* Event Thumbnail */}
                {item.thumbnail && (
                  <figure className="h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </figure>
                )}

                {/* Event Type Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`badge ${item.type === 'IEEE' ? 'badge-primary' : 'badge-secondary'} badge-lg shadow-lg`}>
                    {item.type}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body p-6">
                  <h2 className="card-title text-2xl mb-2 group-hover:text-primary transition-colors duration-200">
                    {item.title}
                  </h2>

                  <p className="text-base-content/70 line-clamp-3 mb-4">
                    {item.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-3 mb-4">
                    {/* Location */}
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-base-content/80">{item.location}</span>
                    </div>

                    {/* Start Date */}
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-base-content/60 font-semibold">Start Date</p>
                        <p className="text-sm text-base-content/80">{formatDate(item.startDate)}</p>
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-base-content/60 font-semibold">End Date</p>
                        <p className="text-sm text-base-content/80">{formatDate(item.endDate)}</p>
                      </div>
                    </div>

                    {/* Capacity & Registered */}
                    <div className="flex items-center justify-between pt-2 border-t border-base-300">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-xs text-base-content/60">
                            {item.registeredCount || 0} / {item.capacity || '∞'} registered
                          </span>
                        </div>
                      </div>
                      {item.capacity && (
                        <div className="flex-1 ml-4">
                          <progress
                            className="progress progress-primary h-2"
                            value={((item.registeredCount || 0) / item.capacity) * 100}
                            max="100"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions justify-end mt-4">
                    {user.role === "SUPER_ADMIN" || user.role === "TEMP_ADMIN "?
                        <button className="btn btn-primary btn-sm" onClick={() => navigate({
                          to: '/getregistration/$id',
                          params: { id: item._id }
                        })}>
                          View Details
                        </button>:null
                    }
                    
                    <button className="btn btn-outline btn-primary btn-sm">
                      Register
                    </button>
                    {
                      user.role === "SUPER_ADMIN" || user.role === "TEMP_ADMIN" ? <button className="btn btn-outline btn-error btn-sm" onClick={() => {setShowPopUp(true)
                                        setDeleteEventId(item._id)
                      }}>
                        Delete
                      </button> : null
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showPopUp && (
        <Modal>
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade">
            <div className="bg-base-100 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-base-300 animate-scale">

              <h2 className="text-xl font-semibold mb-4 text-center">
                Are you sure you want to delete this event?
              </h2>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="btn btn-error btn-sm"
                  onClick={() => {
                    handleDelete(deleteEventId)
                    setShowPopUp(false)
                  }}
                >
                  Delete
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowPopUp(false)}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </Modal>
      )}

    </div>

  )
}

export default AllEvents