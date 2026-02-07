/**
 * Bluetooth caliper integration stub.
 *
 * Uses the Web Bluetooth API to pair with a BLE digital caliper.
 * The actual GATT service / characteristic UUIDs would vary per hardware model
 * and should be configured via environment or settings in production.
 */

export async function connectCaliper(): Promise<BluetoothDevice | null> {
  if (!navigator.bluetooth) return null
  try {
    return await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
  } catch {
    return null
  }
}

export async function readMeasurement(
  _device: BluetoothDevice,
): Promise<number | null> {
  // Stub implementation - in production this would:
  // 1. Connect to the device's GATT server
  // 2. Get the measurement service by UUID
  // 3. Get the characteristic for measurement value
  // 4. Read the value and parse it from bytes to inches
  return null
}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth
}
