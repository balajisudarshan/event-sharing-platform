import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from '../Modal'


const AllUsers = () => {
    const API_URL = import.meta.env.VITE_API_URL
    const [users, setUsers] = useState([])
    const [showPopUp, setShowPopUp] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [selectedRole, setSelectedRole] = useState("")
    const [tempUntilDate, setTempUntilDate] = useState("")
    const token = localStorage.getItem("token")
    useEffect(() => {
        const fetchUsers = async () => {
            const res = await axios.get(`${API_URL}/auth/getAllUsers?page=${page}&limit=5`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })


            console.log(res.data.users)
            setUsers(res.data.users)
            setPages(res.data.pages)
        }
        fetchUsers()
    }, [page])


    const promoteUser = async () => {
        if (!selectedRole) return;
        let body = {}


        if (selectedRole === "TEMP_ADMIN") {
            if (!tempUntilDate) {
                return;
            }
            body = { until: new Date(tempUntilDate).toISOString() }
        }
        console.log(selectedUser._id)
        await axios.put(`${API_URL}/auth/promote/${selectedRole}/${selectedUser._id}`, body, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        setShowPopUp(false);
        window.location.reload();
    }
    return (
        <div className='p-6 flex flex-col justify-center items-center wrap w-full'>
            <h1 className='text-3xl mb-6 text-center mb-6'>Manage Users</h1>
            <div className='w-[90%]'>
                <table className='table table-zebra w-full'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Is IEEE</th>
                            <th>IEEE Id</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            return (
                                <tr>
                                    <td>{user.name}</td>
                                    <td>{user.isIEEE ? "Yes" : "No"}</td>
                                    <td>{user.IEEE_ID}</td>
                                    <td>
                                        <div className={`badge badge-soft ${user.role === "SUPER_ADMIN" ? "badge-primary" : user.role !== "USER" ? "badge-accent" : "badge-neutral"}`}>{user.role}</div>

                                    </td>

                                    <td><button className="btn btn-sm btn-info" onClick={() => { setShowPopUp(!showPopUp); setSelectedUser(user) }}>View</button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <div className="join mt-4 flex justify-center items-center">
                    <button
                        className="join-item btn btn-sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        «
                    </button>

                    <button className="join-item btn btn-sm pointer-events-none">
                        Page {page} / {pages}
                    </button>

                    <button
                        className="join-item btn btn-sm"
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                    >
                        »
                    </button>
                </div>

            </div>
            {showPopUp && selectedUser && (
                <dialog open className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box rounded-xl shadow-xl border border-base-300 p-6">
                        <h3 className="font-bold text-2xl mb-6 text-center">User Details</h3>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full border border-base-300 rounded-lg">
                                <thead className="bg-base-200">
                                    <tr className="text-base font-semibold">
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Is IEEE</th>
                                        <th>IEEE ID</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                        {selectedRole === "TEMP_ADMIN" && <th>Until</th>}
                                        <th>Other</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="hover:bg-base-100">
                                        <td className="py-3">{selectedUser.name}</td>
                                        <td>{selectedUser.email}</td>
                                        <td>{selectedUser.isIEEE ? "Yes" : "No"}</td>
                                        <td>{selectedUser.IEEE_ID}</td>
                                        <td>
                                            <div
                                                className={`badge badge-soft ${selectedUser.role === "SUPER_ADMIN"
                                                    ? "badge-primary"
                                                    : selectedUser.role !== "USER"
                                                        ? "badge-accent"
                                                        : "badge-neutral"
                                                    }`}
                                            >
                                                {selectedUser.role}
                                            </div>
                                        </td>
                                        <td>
                                            <select className='select select-sm w-full' value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                                <option value="">Select Option</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                                <option value="TEMP_ADMIN">Temp Admin</option>
                                                <option value="USER">User</option>
                                            </select>

                                        </td>
                                        {selectedRole === "TEMP_ADMIN" && <td>
                                            <input type="date"
                                                className="input input-bordered input-sm w-full mt-2"
                                                value={tempUntilDate} onChange={(e) => setTempUntilDate(e.target.value)} />
                                        </td>}
                                        <td>
                                            <button className='btn btn-sm btn-outline btn-error'>Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>


                        </div>

                        <div className="modal-action mt-6 flex gap-3 w-full">
                            <button className="btn btn-primary flex-1" onClick={promoteUser}>Save Changes</button>
                            <button
                                className="btn btn-error flex-1"
                                onClick={() => setShowPopUp(false)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </dialog>
            )}


        </div>
    )
}

export default AllUsers