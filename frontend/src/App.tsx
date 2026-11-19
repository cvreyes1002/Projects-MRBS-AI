import React, { useState, useEffect } from 'react';
import api from './api';

// --- TYPE INTERFACES ---
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
}

interface MeetingRoom {
  id: number;
  office: number;
  office_name: string;
  name: string;
  capacity: number;
  amenities: string;
}

interface Office {
  id: number;
  name: string;
  location: string;
  rooms: MeetingRoom[];
}

interface Booking {
  id: number;
  room: number;
  room_name: string;
  user: number;
  user_name: string;
  title: string;
  start_time: string;
  end_time: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Auth Form State
  const [authData, setAuthData] = useState({ email: '', first_name: '', last_name: '', password: '', is_admin: false });

  // Data States
  const [offices, setOffices] = useState<Office[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Admin Form States
  const [officeForm, setOfficeForm] = useState({ name: '', location: '' });
  const [roomForm, setRoomForm] = useState({ office: '', name: '', capacity: 4, amenities: '' });

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({ room: '', title: '', start_time: '', end_time: '' });
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<User>('users/me/');
      setUser(res.data);
      fetchData();
    } catch {
      localStorage.removeItem('access_token');
    }
  };

  const fetchData = async () => {
    try {
      const [officesRes, bookingsRes, usersRes] = await Promise.all([
        api.get<Office[]>('offices/'),
        api.get<Booking[]>('bookings/'),
        api.get<User[]>('users/')
      ]);
      setOffices(officesRes.data);
      setBookings(bookingsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isRegistering) {
        await api.post('users/', authData);
        setIsRegistering(false);
        alert('Account created! Please log in.');
      } else {
        const res = await api.post<{ access: string }>('token/', {
          email: authData.email,
          password: authData.password,
        });
        localStorage.setItem('access_token', res.data.access);
        fetchCurrentUser();
      }
    } catch (err) {
      setErrorMsg('Authentication failed. Check credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('offices/', officeForm);
    setOfficeForm({ name: '', location: '' });
    fetchData();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('rooms/', roomForm);
    setRoomForm({ office: '', name: '', capacity: 4, amenities: '' });
    fetchData();
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('bookings/', bookingForm);
      setBookingForm({ room: '', title: '', start_time: '', end_time: '' });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to book room.');
    }
  };

  const handleToggleAdmin = async (targetUser: User) => {
    try {
      await api.patch(`users/${targetUser.id}/`, {
        is_admin: !targetUser.is_admin
      });
      fetchData();
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  // --- LOGIN / REGISTER VIEW ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isRegistering ? 'Create Account' : 'Meeting Room Login'}
          </h2>
          {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-4">
              {isRegistering && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={authData.first_name}
                      onChange={(e) => setAuthData({ ...authData, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={authData.last_name}
                      onChange={(e) => setAuthData({ ...authData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                />
              </div>
              {isRegistering && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={authData.is_admin}
                    onChange={(e) => setAuthData({ ...authData, is_admin: e.target.checked })}
                  />
                  <label htmlFor="isAdmin" className="text-sm text-gray-700">Register as Admin</label>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {isRegistering ? 'Register' : 'Login'}
              </button>
            </div>
          </form>
          <button
            className="w-full mt-4 text-sm text-blue-600 hover:underline text-center"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Login' : "Need an account? Register"}
          </button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Meeting Room System</h1>
            <p className="text-xs text-gray-500">
              Logged in as <span className="font-semibold">{user.username}</span> ({user.is_admin ? 'Admin' : 'Standard User'})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ADMIN SECTION */}
        {user.is_admin && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Admin Control Panel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add Office Form */}
              <form onSubmit={handleCreateOffice} className="space-y-4">
                <h4 className="font-medium text-gray-700">1. Add Office</h4>
                <input
                  type="text"
                  placeholder="Office Name (e.g., HQ)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Location (e.g., Manila)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={officeForm.location}
                  onChange={(e) => setOfficeForm({ ...officeForm, location: e.target.value })}
                />
                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Create Office
                </button>
              </form>

              {/* Add Room Form */}
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <h4 className="font-medium text-gray-700">2. Add Meeting Room</h4>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={roomForm.office}
                  onChange={(e) => setRoomForm({ ...roomForm, office: e.target.value })}
                >
                  <option value="">Select Office</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.location})</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Room Name (e.g., Boardroom A)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Capacity"
                  min={1}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                />
                <input
                  type="text"
                  placeholder="Amenities (Projector, Zoom, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                />
                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Create Room
                </button>
              </form>
            </div>

            {/* User Management Table */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-4">Manage Registered Users</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {u.first_name} {u.last_name} {u.id === user.id && <span className="text-xs text-blue-600 font-normal">(You)</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${u.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.is_admin ? 'Admin' : 'Standard User'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleToggleAdmin(u)}
                              className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded font-medium shadow-sm transition-colors"
                            >
                              Make {u.is_admin ? 'Standard User' : 'Admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* BOOK A ROOM SECTION */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Book a Meeting Room</h3>
          {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>}
          <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Room</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={bookingForm.room}
                onChange={(e) => setBookingForm({ ...bookingForm, room: e.target.value })}
              >
                <option value="">Select Room</option>
                {offices.map((office) =>
                  office.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {office.name} - {room.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title</label>
              <input
                type="text"
                placeholder="Meeting Title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Start Time</label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={bookingForm.start_time}
                onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">End Time</label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={bookingForm.end_time}
                onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Book Room
            </button>
          </form>
        </section>

        {/* DIRECTORY & SCHEDULE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Offices & Rooms List */}
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Offices & Rooms</h3>
            <div className="space-y-4">
              {offices.map((office) => (
                <div key={office.id} className="border border-gray-100 bg-gray-50 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800">{office.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{office.location}</div>
                  <ul className="space-y-2 mt-2">
                    {office.rooms.length === 0 ? (
                      <li className="text-xs text-gray-400 italic">No rooms added yet.</li>
                    ) : (
                      office.rooms.map((room) => (
                        <li key={room.id} className="bg-white p-2 rounded border border-gray-200 text-xs">
                          <span className="font-medium text-gray-800">{room.name}</span>
                          <div className="text-gray-500">Capacity: {room.capacity} | {room.amenities || 'Standard'}</div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Scheduled Bookings */}
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Bookings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Booked By</th>
                    <th className="py-3 px-4">Start</th>
                    <th className="py-3 px-4">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400 text-xs italic">No bookings scheduled yet.</td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{b.room_name}</td>
                        <td className="py-3 px-4 text-gray-600">{b.title}</td>
                        <td className="py-3 px-4 text-gray-600">{b.user_name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{new Date(b.start_time).toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{new Date(b.end_time).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}