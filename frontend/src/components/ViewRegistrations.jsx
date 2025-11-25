import { useParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from '../Modal'

const ViewRegistrations = () => {
  const { id } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPopUp, setShowPopUp] = useState(false)
  const [user, setUser] = useState(null)
  const [status,setStatus] = useState('AWAITING_CONFIRMATION')
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
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setShowPopUp(true)
                      setUser(u)
                    }}
                  >
                    View
                  </button>
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
      {(showPopUp && user) && (
        <Modal>
          <div className='fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 sm:px-6'>
            <div className='w-full max-w-3xl mx-auto bg-base-100 rounded-3xl shadow-2xl border border-base-200 overflow-hidden max-h-[90vh] flex flex-col'>
              <div className='flex items-center justify-between px-8 py-5 bg-base-200 border-b border-base-300'>
                <div>
                  <p className='text-sm text-base-content/60 uppercase tracking-wide'>Registration details</p>
                  <h3 className='text-2xl font-semibold text-base-content'>{user?.user?.name}</h3>
                </div>
                <button
                  className='btn btn-sm btn-ghost btn-circle'
                  onClick={() => {
                    setShowPopUp(false)
                    setUser(null)
                  }}
                >
                  ✕
                </button>
              </div>

              <div className='flex-1 px-6 sm:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto'>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>Name</p>
                  <p className='text-lg font-medium text-base-content'>{user?.user?.name}</p>
                </div>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>User ID</p>
                  <p className='text-lg font-medium text-base-content'>{user?.user?.studentId || '—'}</p>
                </div>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>Branch</p>
                  <p className='text-lg font-medium text-base-content'>{user?.user?.branch || '—'}</p>
                </div>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>Year</p>
                  <p className='text-lg font-medium text-base-content'>{user?.user?.year || 'No data'}</p>
                </div>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>Payment Status</p>
                  <div className={`badge ${user?.payment_transaction_id ? 'badge-success' : 'badge-ghost'}`}>
                    {user?.payment_transaction_id ? 'Payment received' : 'Pending'}
                  </div>
                </div>
                <div className='space-y-2'>
                  <p className='text-xs uppercase text-base-content/60 tracking-wide'>Transaction ID</p>
                  <p className='text-lg font-mono text-base-content wrap-break-word'>{user?.payment_transaction_id || '—'}</p>
                </div>
                <div className='p-3 rounded-2xl flex gap-2 items-center'>
                  <input type='checkbox' className='checkbox checkbox-accent checkbox-sm space-y-2' onChange={(e)=>{
                    if(e.target.checked){
                      setStatus("REGISTERED")
                    }else{
                      setStatus("AWAITING_CONFIRMATION")
                    }
                  }}></input>
                  <label> Verified</label>
                </div>
              </div>

              <div className='px-6 sm:px-8 py-4 bg-base-200 border-t border-base-300 flex flex-wrap gap-3 justify-end'>
                <button
                  className='btn btn-ghost'
                  onClick={() => {
                    setShowPopUp(false)
                    setUser(null)
                  }}
                >
                  Close
                </button>
                <button className='btn btn-primary'>
                  Update Details
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ViewRegistrations
