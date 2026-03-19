export interface VitalsData {
  temperature?: number
  tempUnit: 'F' | 'C'
  systolic?: number
  diastolic?: number
  weight?: number
  spo2?: number
}

interface VitalsInputProps {
  value: VitalsData
  onChange: (data: VitalsData) => void
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9 / 5 + 32) * 10) / 10
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5 / 9) * 10) / 10
}

export function VitalsInput({ value, onChange }: VitalsInputProps) {
  function handleTempChange(raw: string) {
    const parsed = raw === '' ? undefined : parseFloat(raw)
    onChange({ ...value, temperature: parsed !== undefined && isNaN(parsed) ? undefined : parsed })
  }

  function handleToggleUnit() {
    const newUnit = value.tempUnit === 'F' ? 'C' : 'F'
    let newTemp = value.temperature
    if (newTemp !== undefined) {
      newTemp = value.tempUnit === 'F'
        ? fahrenheitToCelsius(newTemp)
        : celsiusToFahrenheit(newTemp)
    }
    onChange({ ...value, tempUnit: newUnit, temperature: newTemp })
  }

  function handleNumberField(field: keyof Omit<VitalsData, 'tempUnit' | 'temperature'>, raw: string) {
    const parsed = raw === '' ? undefined : parseFloat(raw)
    onChange({ ...value, [field]: parsed !== undefined && isNaN(parsed) ? undefined : parsed })
  }

  const inputClass = 'w-full px-3 py-2 text-base border border-gray-300 rounded-lg'
  const inputStyle = { minHeight: '44px' }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="98.6"
            value={value.temperature !== undefined ? value.temperature : ''}
            onChange={(e) => handleTempChange(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleToggleUnit}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 shrink-0"
          >
            {value.tempUnit}
          </button>
        </div>
      </div>

      {/* Blood Pressure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="1"
            inputMode="numeric"
            placeholder="120"
            value={value.systolic !== undefined ? value.systolic : ''}
            onChange={(e) => handleNumberField('systolic', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <span className="text-gray-500 font-medium">/</span>
          <input
            type="number"
            step="1"
            inputMode="numeric"
            placeholder="80"
            value={value.diastolic !== undefined ? value.diastolic : ''}
            onChange={(e) => handleNumberField('diastolic', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder="72"
          value={value.weight !== undefined ? value.weight : ''}
          onChange={(e) => handleNumberField('weight', e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* SpO2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%)</label>
        <input
          type="number"
          step="1"
          inputMode="numeric"
          placeholder="98"
          value={value.spo2 !== undefined ? value.spo2 : ''}
          onChange={(e) => handleNumberField('spo2', e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>
    </div>
  )
}
