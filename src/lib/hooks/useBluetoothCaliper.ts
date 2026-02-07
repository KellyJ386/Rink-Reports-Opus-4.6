'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  connectCaliper,
  readMeasurement,
  isBluetoothSupported,
} from '@/lib/bluetooth/caliper'

interface UseBluetoothCaliperReturn {
  /** Whether Web Bluetooth is available in this browser */
  isSupported: boolean
  /** Whether we have an active BLE connection */
  isConnected: boolean
  /** Initiate the BLE pairing / connection flow */
  connect: () => Promise<void>
  /** Request a reading from the connected caliper */
  read: () => Promise<number | null>
  /** Most recent value received (inches) */
  value: number | null
  /** Last error message, if any */
  error: string | null
}

export function useBluetoothCaliper(): UseBluetoothCaliperReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [value, setValue] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const deviceRef = useRef<BluetoothDevice | null>(null)

  // Check support after mount (navigator not available during SSR)
  useEffect(() => {
    setIsSupported(isBluetoothSupported())
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    try {
      const device = await connectCaliper()
      if (device) {
        deviceRef.current = device
        setIsConnected(true)

        // Listen for disconnection
        device.addEventListener('gattserverdisconnected', () => {
          setIsConnected(false)
          deviceRef.current = null
        })
      } else {
        setError('Could not connect to caliper. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnected(false)
    }
  }, [])

  const read = useCallback(async (): Promise<number | null> => {
    setError(null)
    if (!deviceRef.current) {
      setError('No caliper connected')
      return null
    }
    try {
      const measurement = await readMeasurement(deviceRef.current)
      if (measurement !== null) {
        setValue(measurement)
      }
      return measurement
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Read failed')
      return null
    }
  }, [])

  return { isSupported, isConnected, connect, read, value, error }
}
