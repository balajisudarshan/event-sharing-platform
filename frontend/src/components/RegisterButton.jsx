import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../Modal'

const RegisterButton = ({ eventId }) => {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [paid, setPaid] = useState(false)
  const [paymentId, setPaymentId] = useState('')
  const [showPopUp, setShowPopUp] = useState(false)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user"))
  const userId = user?._id

  // --------------------- CHECK REGISTERED ---------------------
  useEffect(() => {
    const checkUserRegistered = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/registrations/users/${userId}/registrations`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

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

  // --------------------- HANDLE REGISTER ---------------------
  const handleRegister = async () => {
    setLoading(true)

    try {
      let payload = {}

      if (paid) {
        payload = { payment_transaction_id: paymentId }
      }

      const res = await axios.post(
        `${API_URL}/registrations/events/${eventId}/register`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log("REGISTER SUCCESS:", res.data)
      setRegistered(true)
      setError("")
      return true

    } catch (error) {
      console.log("REGISTER ERROR:", error.response?.data || error)
      setError(error.response?.data?.message || "Something went wrong.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // --------------------- MODAL HELPERS ---------------------

  const closeModal = () => {
    setShowPopUp(false)
    setPaid(false)
    setPaymentId('')
    // keep error for inside modal logic only
  }

  const handleModalSubmit = async () => {
    if (paid && !paymentId.trim()) {
      setError("Please enter your payment ID.")
      return
    }

    const success = await handleRegister()
    if (success) closeModal()
  }

  // --------------------- UI ---------------------

  return (
    <>
      <button
        className="btn btn-outline btn-primary btn-sm"
        onClick={() => {
          setError('')
          setShowPopUp(true)
        }}
        disabled={registered || loading}
      >
        {registered ? "Registered" : loading ? "Registering..." : "Register"}
      </button>

      {showPopUp && (
        <Modal>
          <div className='fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4'>
            <div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-base-300'>
              <div className='mb-6 text-center space-y-2'>
                <p className='text-sm font-semibold tracking-[0.3em] uppercase text-primary'>Secure Spot</p>
                <h2 className='text-2xl font-bold text-gray-900'>Complete your registration</h2>
                <p className='text-sm text-gray-500'>Confirm your payment status so we can reserve your seat instantly.</p>
              </div>

              <div className='space-y-4'>
                <label className='flex items-center gap-3 rounded-xl border border-base-200 px-4 py-3 transition hover:border-primary/60'>
                  <input
                    type='checkbox'
                    checked={paid}
                    onChange={() => setPaid(prev => !prev)}
                    className='checkbox checkbox-primary checkbox-sm'
                  />
                  <div>
                    <p className='font-medium text-gray-800'>I have already paid</p>
                    <p className='text-xs text-gray-500'>Check this if you have completed the payment.</p>
                  </div>
                </label>

                {paid && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700' htmlFor='payment-id'>
                      Payment Confirmation ID
                    </label>
                    <input
                      id='payment-id'
                      type='text'
                      placeholder='e.g. TXN-45213'
                      value={paymentId}
                      onChange={e => setPaymentId(e.target.value)}
                      className='input input-bordered w-full focus:input-primary'
                    />
                  </div>
                )}

                {error && (
                  <p className='text-sm text-error'>{error}</p>
                )}
              </div>

              <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
                <button
                  onClick={handleModalSubmit}
                  className='btn btn-primary flex-1'
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm & Register'}
                </button>
                <button
                  onClick={closeModal}
                  className='btn btn-ghost flex-1 text-base-content/70 hover:text-base-content'
                  disabled={loading}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default RegisterButton
