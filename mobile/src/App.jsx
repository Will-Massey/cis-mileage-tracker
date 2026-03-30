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
  const [showWelcome, setShowWelcome] = useState(true)
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
        setShowWelcome(false)
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

  const dismissWelcome = () => {
    setShowWelcome(false)
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
      <div className="p-4 pb-28">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold">CIS Mileage Tracker</h1>
          <p className="text-slate-400 text-sm">Welcome back, {user.firstName}</p>
        </div>

        {/* Welcome Banner - Shows Value Proposition */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-white">💰 Save Money on Tax</h3>
              <button 
                onClick={dismissWelcome}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-blue-100 mb-3">
              As a CIS contractor, every business mile saves you <strong>20% in tax</strong>. 
              Drive 100 miles = claim £45 = <strong>save £9</strong>!
            </p>
            <div className="flex gap-2 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded">45p/mile</span>
              <span className="bg-white/20 px-2 py-1 rounded">20% CIS</span>
              <span className="bg-white/20 px-2 py-1 rounded">HMRC Approved</span>
            </div>
          </div>
        )}

        {/* CIS Savings Card - Full Width */}
        <div className="mb-4">
          <CISSavingsCard 
            totalMiles={stats.monthMiles}
            totalClaim={stats.monthMiles * 0.45}
            taxSaved={stats.monthMiles * 0.45 * 0.20}
            cisRate={'20%'}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{stats.todayMiles.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Today's Miles</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.weekMiles.toFixed(0)}</div>
            <div className="text-xs text-slate-400">This Week</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{stats.monthMiles.toFixed(0)}</div>
            <div className="text-xs text-slate-400">This Month</div>
          </div>
        </div>

        {/* GPS Tracking Section */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h2 className="text-base font-semibold mb-3">Track Trip</h2>
          
          {/* GPS Warning for Web */}
          {!isNative && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-200">
                <strong>⚠️ Browser Mode:</strong> GPS auto-tracking requires the native app. 
                For automatic tracking, install from app store (coming soon) or use Android Studio build.
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <GPSTrackingButton 
              onTripStart={() => console.log('Trip started')}
              onTripEnd={handleTripComplete}
              userId={user.id}
            />
          </div>
          <p className="text-center text-slate-400 text-xs mt-3">
            {isNative 
              ? 'Tap to start. Trip auto-starts at 5mph.' 
              : 'Manual mode: Tap to add trip manually'
            }
          </p>
        </div>

        {/* Value Example */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-green-400 mb-2">💡 See the Savings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Weekly commute (50 miles × 5 days)</span>
              <span className="text-green-400 font-semibold">Save £9/week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Monthly (200 miles/week)</span>
              <span className="text-green-400 font-semibold">Save £36/month</span>
            </div>
            <div className="flex justify-between border-t border-green-500/20 pt-2">
              <span className="text-slate-300">Yearly potential</span>
              <span className="text-green-400 font-bold">Save £400+/year</span>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="mb-4">
          <h2 className="text-base font-semibold mb-3">Recent Trips</h2>
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
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-slate-400 text-sm">No trips recorded yet</p>
                <p className="text-slate-500 text-xs mt-1">
                  Tap "Start Tracking" above to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sites */}
        <SiteManager userId={user.id} />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-bottom">
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
      <p className="text-slate-400 text-center mb-2">
        Track mileage, calculate CIS tax savings
      </p>
      
      {/* Value Prop on Login */}
      <div className="bg-green-500/10 rounded-xl p-4 mb-6 max-w-xs">
        <p className="text-sm text-green-200 text-center">
          💰 Save <strong>20% tax</strong> on every business mile
        </p>
        <p className="text-xs text-slate-400 text-center mt-1">
          Average CIS contractor saves £400+ per year
        </p>
      </div>
      
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
