import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const COLORS = [
  { id: 'black',  hex: 'bg-black' },
  { id: 'white',  hex: 'bg-white border-2 border-gray-200' },
  { id: 'navy',   hex: 'bg-blue-900' },
  { id: 'olive',  hex: 'bg-emerald-800' },
  { id: 'burgundy', hex: 'bg-rose-900' },
  { id: 'sand',   hex: 'bg-amber-100' },
  { id: 'purple', hex: 'bg-purple-600' }
];

const VIBES = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'festive', label: 'Festive' },
  { id: 'professional', label: 'Corporate' },
  { id: 'street', label: 'Streetwear' },
  { id: 'luxe', label: 'Luxe Glamour' }
];

export default function AdvancedFilterSidebar() {
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [matchPercentage, setMatchPercentage] = useState(85); // Minimum AI Match

  const toggleColor = (id) => {
    if (selectedColors.includes(id)) setSelectedColors(selectedColors.filter(c => c !== id));
    else setSelectedColors([...selectedColors, id]);
  };

  const toggleVibe = (id) => {
    if (selectedVibes.includes(id)) setSelectedVibes(selectedVibes.filter(v => v !== id));
    else setSelectedVibes([...selectedVibes, id]);
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedVibes([]);
    setMatchPercentage(85);
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl border border-gray-100 sticky top-24">
        
        <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600" /> Filters
          </h2>
          <button onClick={clearFilters} className="text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* AI Match Slider */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Match Score</h3>
            <span className="text-purple-700 font-black">{matchPercentage}%</span>
          </div>
          <input 
            type="range" 
            min="50" max="99" 
            value={matchPercentage} 
            onChange={(e) => setMatchPercentage(e.target.value)}
            className="w-full accent-purple-600 cursor-pointer h-2 bg-purple-200 rounded-full"
          />
          <p className="text-xs text-purple-600 font-medium mt-2">Only show highly matched items</p>
        </div>

        {/* Visual Color Swatches */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Color Palette</h3>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(color => (
              <button
                key={color.id}
                onClick={() => toggleColor(color.id)}
                className={`w-8 h-8 rounded-full shadow-sm transition-all transform hover:scale-110 flex items-center justify-center ${color.hex} ${selectedColors.includes(color.id) ? 'ring-4 ring-purple-200 ring-offset-2 scale-110' : 'hover:ring-2 hover:ring-gray-200 ring-offset-1'}`}
                title={color.id}
              >
                {/* Active check indicator for dark/light colors */}
                {selectedColors.includes(color.id) && (
                  <svg className={`w-4 h-4 ${color.id === 'white' || color.id === 'sand' ? 'text-gray-900' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Aesthetic Vibes Selector */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Style Vibe</h3>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe.id}
                onClick={() => toggleVibe(vibe.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  selectedVibes.includes(vibe.id)
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {vibe.label}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-1 transition-all">
          Apply Filters (24)
        </button>

      </div>
    </aside>
  );
}
