'use client'

import { useState, useCallback } from 'react'
import { isBluetoothSupported, connectCaliper, readMeasurement } from '@/lib/bluetooth/caliper'

export function useBluetoothCaliper() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [device, setDevice] = useState<any | null>(null)
  const [lastReading, setLastReading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSupported = isBluetoothSupported()

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    const dev = await connectCaliper()
    if (dev) {
      setDevice(dev)
      setIsConnected(true)
    } else {
      setError('Failed to connect to caliper')
    }
    setIsConnecting(false)
  }, [])

  const read = useCallback(async () => {
    if (!device) {
      setError('No device connected')
      return null
    }
    const value = await readMeasurement(device)
    if (value !== null) {
      setLastReading(value)
    } else {
      setError('Failed to read measurement')
    }
    return value
  }, [device])

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect?.()
    }
    setDevice(null)
    setIsConnected(false)
    setLastReading(null)
  }, [device])

  return {
    isSupported,
    isConnecting,
    isConnected,
    device,
    connect,
    read,
    disconnect,
    lastReading,
    error,
  }
}
