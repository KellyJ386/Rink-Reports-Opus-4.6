// Web Bluetooth API type declarations (subset used by this project)

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  addEventListener(type: 'gattserverdisconnected', listener: EventListener): void
  removeEventListener(type: 'gattserverdisconnected', listener: EventListener): void
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  readonly device: BluetoothDevice
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice
  readonly uuid: string
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic {
  readonly service: BluetoothRemoteGATTService
  readonly uuid: string
  readonly value?: DataView
  readValue(): Promise<DataView>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(type: 'characteristicvaluechanged', listener: EventListener): void
}

interface Bluetooth {
  requestDevice(options: { acceptAllDevices?: boolean; filters?: Array<{ services?: string[] }> }): Promise<BluetoothDevice>
}

interface Navigator {
  bluetooth?: Bluetooth
}
