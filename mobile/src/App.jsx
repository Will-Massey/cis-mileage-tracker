import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { Preferences } from '@capacitor/preferences'

// Components
import GPSTrackingButton from './components/GPSTrackingButton'
import CISSavingsCard from './components/CISSavingsCard'
import SiteManager from './components/SiteManager'
import SwipeableTripCard from './components/SwipeableTripCard'
import ReceiptCapture from './components/ReceiptCapture'

// Services
import GPSTrackingService from './services/GPSTrackingService'
import SQLiteService from './services/SQLiteService'

// Utils
import { calculateCISTaxSavings } from './utils/CISCalculator'

function App() {
  const [isNative, setIsNative] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState(null)
  const [trips, setTrips] = useState([])
  const [stats, setStats] = useState({
    todayMiles: 0,
    todaySavings: 0,
    weekMiles: 0,
    monthMiles: 0
  })

  useEffect(() => {
    // Check if running on native platform
    setIsNative(Capacitor.isNativePlatform())

    // Monitor network status
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected)
    })

    // Load initial data
    loadUserData()
    loadTrips()

    return () => {
      Network.removeAllListeners()
    }
  }, [])

  const loadUserData = async () => {
    try {
      const { value } = await Preferences.get({ key: 'user' })
      if (value) {
        setUser(JSON.parse(value))
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const loadTrips = async () => {
    try {
      // TODO: Load from SQLite when service is ready
      const mockTrips = [
        {
          id: '1',
          date: new Date().toISOString(),
          distance: 12.5,
          startLocation: 'Home',
          endLocation: 'Site A',
          status: 'completed'
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          distance: 8.3,
          startLocation: 'Home',
          endLocation: 'Site B',
          status: 'completed'
        }
      ]
      setTrips(mockTrips)
      calculateStats(mockTrips)
    } catch (error) {
      console.error('Failed to load trips:', error)
    }
  }

  const calculateStats = (tripData) => {
    const today = new Date().toDateString()
    const todayTrips = tripData.filter(t => new Date(t.date).toDateString() === today)
    const todayMiles = todayTrips.reduce((sum, t) => sum + t.distance, 0)
    
    const savings = calculateCISTaxSavings(todayMiles, 0.20)
    
    setStats({
      todayMiles,
      todaySavings: savings.taxSaved,
      weekMiles: tripData.reduce((sum, t) => sum + t.distance, 0),
      monthMiles: tripData.reduce((sum, t) => sum + t.distance, 0)
    })
  }

  const handleTripComplete = (trip) => {
    const updatedTrips = [trip, ...trips]
    setTrips(updatedTrips)
    calculateStats(updatedTrips)
  }

  const handleTripDelete = async (tripId) => {
    const updatedTrips = trips.filter(t => t.id !== tripId)
    setTrips(updatedTrips)
    calculateStats(updatedTrips)
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Status Bar */}
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="text-slate-400">
          CIS Rate: {user.cisRate === 0.30 ? '30%' : '20%'}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">CIS Mileage Tracker</h1>
          <p className="text-slate-400">Welcome back, {user.firstName}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Today's Miles</div>
            <div className="text-2xl font-bold text-blue-400">{stats.todayMiles.toFixed(1)}</div>
          </div>
          <CISSavingsCard 
            miles={stats.todayMiles} 
            cisRate={user.cisRate || 0.20} 
          />
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm">This Week</div>
            <div className="text-xl font-bold">{stats.weekMiles.toFixed(1)} mi</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-sm">This Month</div>
            <div className="text-xl font-bold">{stats.monthMiles.toFixed(1)} mi</div>
          </div>
        </div>

        {/* GPS Tracking */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Track Trip</h2>
          <div className="flex justify-center">
            <GPSTrackingButton 
              onTripStart={() => console.log('Trip started')}
              onTripEnd={handleTripComplete}
              userId={user.id}
            />
          </div>
          <p className="text-center text-slate-400 text-sm mt-4">
            Tap to start tracking. Trip auto-starts at 5mph.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ReceiptCapture 
            userId={user.id}
            onCapture={(receipt) => console.log('Receipt:', receipt)}
          />
        </div>

        {/* Recent Trips */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Recent Trips</h2>
          <div className="space-y-3">
            {trips.map(trip => (
              <SwipeableTripCard
                key={trip.id}
                trip={trip}
                onDelete={() => handleTripDelete(trip.id)}
                cisRate={user.cisRate || 0.20}
              />
            ))}
            {trips.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No trips yet. Tap the GPS button to start tracking!
              </div>
            )}
          </div>
        </div>

        {/* Sites */}
        <SiteManager userId={user.id} />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="flex justify-around">
          <NavButton icon="home" label="Home" active />
          <NavButton icon="map" label="Sites" />
          <NavButton icon="receipt" label="Receipts" />
          <NavButton icon="user" label="Profile" />
        </div>
      </nav>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const handleLogin = () => {
    // Mock login for testing
    onLogin({
      id: 'user-1',
      firstName: 'Builder',
      email: 'test@example.com',
      cisRate: 0.20
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl font-bold">CIS</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">CIS Mileage Tracker</h1>
      <p className="text-slate-400 text-center mb-8">
        Track mileage, calculate CIS tax savings, and manage construction sites
      </p>
      <button
        onClick={handleLogin}
        className="w-full max-w-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        Get Started
      </button>
    </div>
  )
}

function NavButton({ icon, label, active }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-blue-400' : 'text-slate-400'}`}>
      <div className="w-6 h-6">
        {/* Icon placeholder */}
        <div className="w-full h-full bg-current rounded-sm" />
      </div>
      <span className="text-xs">{label}</span>
    </button>
  )
}

export default App
