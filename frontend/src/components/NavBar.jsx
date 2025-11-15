import React, { useState, useContext, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { AuthContext } from '../context/AuthContext'

const NavBar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isLoggedIn, user, logOut } = useContext(AuthContext)

  
  const navLink =
    "relative text-base font-semibold transition-all duration-300 hover:text-white " +
    "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-base-100 " +
    "after:transition-all after:duration-300 hover:after:w-full"

  const mobileLink =
    "text-base font-medium text-base-100 hover:bg-primary-focus rounded-xl px-4 py-2 transition-all"

  const links = useMemo(() => {
    if (!isLoggedIn) {
      return [
        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" }
      ]
    }

    // logged-in users
    const userLinks = [
      { to: "/allevents", label: "All Events" }
    ]

    if (user?.role !== "USER") {
      userLinks.push(
        { to: "/manage-events", label: "Manage Event" },
        { to: "/manage-users", label: "Users" }
      )
    }

    return userLinks
  }, [isLoggedIn, user])

  return (
    <>
      {/* TOP NAV */}
      <nav className="navbar bg-primary text-base-100 shadow-lg sticky top-0 z-50">

        <div className="flex-1 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-base-100 to-base-300">
            EVENT-MANAGEMENT-SYSTEM
          </h2>
        </div>

        <div className="flex-none">

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {links.map(link => (
              <Link key={link.to} to={link.to} className={navLink}>
                {link.label}
              </Link>
            ))}

            {isLoggedIn && (
              <button onClick={logOut} className={navLink}>
                Logout
              </button>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="btn btn-ghost btn-circle hover:bg-primary-focus transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SIDEBAR */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />

        <div
          className="fixed inset-y-0 left-0 w-80 bg-primary shadow-2xl transform transition-transform duration-300"
          style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-focus">
            <h3 className="text-xl font-bold text-base-100">Menu</h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="btn btn-ghost btn-circle hover:bg-primary-focus"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* MOBILE LINKS */}
          <ul className="menu p-4 space-y-2">
            {links.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={mobileLink}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {isLoggedIn && (
              <li>
                <button
                  onClick={() => { logOut(); setIsSidebarOpen(false); }}
                  className={`${mobileLink} w-full text-left`}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>

        </div>
      </div>
    </>
  )
}

export default NavBar
