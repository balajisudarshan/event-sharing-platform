import React, { useState } from 'react'
import axios from 'axios'
const Register = () => {
  // -------------------- STATE VARIABLES --------------------
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isIeee, SetIsIeee] = useState(false)
  const [ieeeId, setIeeeId] = useState('')
  const [branch, setBranch] = useState('')
  const [studentId,setStudentId] = useState('')
  const [year,setYear] = useState(1)


  const [success,setSuccess] = useState('')

  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL

  const [isLoading, setIsLoading] = useState(false)


  const branches = [
    'CSE',
    'CSE-AIDS',
    'ECE',
    'EEE',
    'ME',
    'CE'
  ]

  const handleSubmit = async(e)=>{
    e.preventDefault()
    setIsLoading(true)
    setError('')
    console.log(API_URL)
    try {
      const res = await axios.post(`${API_URL}/auth/register`,{name:username,
        password,
        email,
        isIeee,
        ieeeId,
        branch,
        studentId,
      })
      setSuccess(res.data.message)
      alert(res.data.message)
      setError('')
      console.log(res)
    } catch (error) {
      console.log(error)
      setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  // -------------------- RETURN UI --------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center p-4">

      {/* -------------------- CARD CONTAINER -------------------- */}
      <div className="card bg-base-100 shadow-2xl border border-base-300 sm:w-md w-100 mb-30 lg:mb-0 ">
        <div className="card-body p-8">

          {/* -------------------- HEADER SECTION -------------------- */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold bg-primary bg-clip-text text-transparent">
              Welcome
            </h1>
            <p className="text-base-content/70 mt-2">Sign up to create account</p>
          </div>

          {/* -------------------- FORM SECTION -------------------- */}
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Error Message */}
            <h1 className={error.length > 0 ? `text-error font-medium` : 'hidden'}>
              Error : {error}
            </h1>

            {/* Username Input */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input input-bordered input-lg w-full transition-all duration-200 focus:input-primary focus:ring-4 focus:ring-primary/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Email Input */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your Email"
                className="input input-bordered input-lg w-full transition-all duration-200 focus:input-primary focus:ring-4 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered input-lg w-full transition-all duration-200 focus:input-primary focus:ring-4 focus:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* IEEE Checkbox */}
            <div className="form-control flex row justify-between">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Are you IEEE member</span>
              </label>
              <input
                type='checkbox'
                className='checkbox checkbox-primary'
                checked={isIeee}
                onChange={(e) => SetIsIeee(e.target.checked)}
              />
            </div>

            {/* IEEE ID Field (Conditional) */}
            {isIeee && (
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-base-content">Enter your IEEE id</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your IEEE id"
                  className="input input-bordered input-lg w-full transition-all duration-200 focus:input-primary focus:ring-4 focus:ring-primary/20"
                  value={ieeeId}
                  onChange={(e) => setIeeeId(e.target.value)}
                />
              </div>
            )}

            {/* Branch Section */}

            <div className="form-control justify-between">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Select your branch</span>
              </label>
              <select className='select w-full' onChange={(e)=>setBranch(e.target.value)}>
                <option>Select your branch</option>
                {branches.map((item)=>{
                  return <option>{item}</option>
                })}
              </select>
            </div>

            {/* Student Id */}

            <div className="form-control justify-between">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Enter your Id (Roll No)</span>
              </label>
              <input
                type='text'
                className='input input-bordered input-md w-full transition-all duration-200 focus:input-primary focus:ring-4 focus:ring-primary/20'
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            
            {/* Year field */}

            <div className="form-control row justify-between">
              <label className="label pb-1">
                <span className="label-text font-semibold text-base-content">Select your year</span>
              </label>
              <select className='select w-full' onChange={(e)=>setYear(e.target.value)}>
                <option>Select year</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-8">
              <button 
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full text-lg font-semibold shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Registering...' : 'Sign Up'}
              </button>
            </div>

          </form>

          {/* -------------------- DIVIDER SECTION -------------------- */}
          <div className="divider my-8 text-sm">OR</div>

          {/* -------------------- FOOTER SECTION -------------------- */}
          <div className="text-center">
            <p className="text-base-content/70">
              Already have an account?{' '}
              <a href="/" className="link link-primary font-semibold hover:link-hover">
                Login here
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Register
