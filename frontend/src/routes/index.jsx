import React from 'react'
import { useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogin = async(e)=>{
    e.preventDefault()
    setIsLoading(true)
    setError('')
    console.log(API_URL)
    try {
      const res = await axios.post(`${API_URL}/auth/login`,{email,
        password,
      })
      
      login(res.data.user,res.data.token)
      alert(res.data.message)
      setError('')
      console.log(res)
      
      // Navigate to home page using router
      navigate({ to: '/allevents' })
    } catch (error) {
      console.log(error)
      setError(error.response?.data?.message || error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  return (

    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl border border-base-300 sm:w-md w-100 mb-30 lg:mb-0 ">
        <form className="card-body p-8" onSubmit={handleLogin}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold bg-primary  bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-base-content/70 mt-2">Sign in to your event management account</p>
          </div>

          <div className="space-y-6">
            <h1 className={error.length > 0 ? `text-error font-medium` : 'hidden'}>Error : {error}</h1>
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

            <div className="flex items-center justify-between">
              {/* <label className="cursor-pointer label py-0">
                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
                <span className="label-text ml-2 text-sm">Remember me</span>
              </label> */}
              <a href="#" className="link link-primary text-sm hover:link-hover">
                Forgot password?
              </a>
            </div>

            <div className="form-control mt-8">
              <button 
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full text-lg font-semibold shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </div>

          <div className="divider my-8 text-sm">OR</div>

          <div className="text-center">
            <p className="text-base-content/70">
              Don't have an account?{' '}
              <Link to="/register" className="link link-primary font-semibold hover:link-hover">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Login,
})