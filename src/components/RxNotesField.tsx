interface RxNotesFieldProps {
  value: string
  onChange: (value: string) => void
  lang: 'en' | 'ur'
  onLangChange: (lang: 'en' | 'ur') => void
  disabled?: boolean
}

export function RxNotesField({ value, onChange, lang, onLangChange, disabled }: RxNotesFieldProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">Rx Notes</label>
        <div className="relative group">
          <div className="inline-flex rounded-full border border-gray-300 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => onLangChange('en')}
              disabled={disabled}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              En
            </button>
            <button
              type="button"
              onClick={() => onLangChange('ur')}
              disabled={disabled}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                lang === 'ur'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={lang === 'ur' ? { fontFamily: "'Noto Nastaliq Urdu Variable', serif" } : undefined}
            >
              اردو
            </button>
          </div>
          <div className="absolute right-0 top-full mt-1 px-2 py-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Switch keyboard: Ctrl+Space (Mac) / Win+Space (Windows)
          </div>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
        placeholder={lang === 'ur' ? 'نسخے کی اضافی ہدایات...' : 'Additional prescription notes...'}
        className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg resize-y"
        style={
          lang === 'ur'
            ? {
                fontFamily: "'Noto Nastaliq Urdu Variable', serif",
                textAlign: 'right',
                lineHeight: '2.2',
                unicodeBidi: 'isolate',
                minHeight: '60px',
              }
            : { minHeight: '60px' }
        }
      />
    </div>
  )
}
