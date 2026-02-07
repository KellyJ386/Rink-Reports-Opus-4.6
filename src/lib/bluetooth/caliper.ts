/* eslint-disable @typescript-eslint/no-explicit-any */

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

export async function connectCaliper(): Promise<any | null> {
  try {
    const bt = (navigator as any).bluetooth
    const device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['generic_access'],
    })
    return device
  } catch {
    return null
  }
}

export async function readMeasurement(device: any): Promise<number | null> {
  try {
    const server = await device.gatt.connect()
    // Placeholder for actual caliper GATT protocol implementation
    void server
    return null
  } catch {
    return null
  }
}
