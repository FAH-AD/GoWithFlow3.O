import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Navbar from '../components/Navbar'

export default function UserLayout() {
    const user = useSelector((state) => state.Auth.user)

    if (!user) {
        return <Navigate to="/login" />
    }

    if (user.role === 'client' || user.role === 'freelancer') {
        return (
            <div className="flex w-screen h-screen bg-[#0a0a0f]">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0a0a0f]">
                        <div className=" mx-auto px-6 py-8 pb-[40px]">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return <Outlet />
}
