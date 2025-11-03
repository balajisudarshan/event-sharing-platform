import React from 'react'

const NavBar = () => {
  return (
    <nav className="navbar bg-primary text-base-100 px-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold">EVENT-MANAGEMENT-SYSTEM</h2>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 gap-4">
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
        </ul>
      </div>
    </nav>
  )
}

export default NavBar
