import { useParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

const ViewRegistrations = () => {
  const { id } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const token = localStorage.getItem("token")
    const load = async () => {
      const res = await axios.get(
        `${API_URL}/events/${id}/registrations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      )

      console.log(res.data.data)
      setUsers(res.data.data)
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className='flex justify-center items-center flex-col mt-5'>

      <h2 className='text-2xl font-base text-accent-heading uppercase underline underline-offset-8 mb-5'>
        Registrations
      </h2>

      <div className="overflow-x-auto rounded-xl shadow-md border border-base-300 w-full max-w-4xl">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200">
            <tr>
              <th className="text-lg font-semibold text-base-content">Name</th>
              <th className="text-lg font-semibold text-base-content">Email</th>
              <th className="text-lg font-semibold text-base-content">Status</th>
              <th className="text-lg font-semibold text-base-content text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-base-300 transition-all">
                <td>{u.user.name}</td>
                <td>{u.user.email}</td>
                <td>
                  <span className={`badge ${u.status === 'REGISTERED'
                    ? 'badge-success'
                    : u.status === 'AWAITING_CONFIRMATION'
                      ? 'badge-warning'
                      : 'badge-info'
                    }`}>
                    {u.status}
                  </span>
                </td>
                <td className="text-right">
                  <button className="btn btn-sm btn-primary">View</button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-base-content/60">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default ViewRegistrations
