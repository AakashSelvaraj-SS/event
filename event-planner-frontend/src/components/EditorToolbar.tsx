import { Save, Share2, ArrowLeft, Layers, Cuboid, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EditorToolbar({ currentMode, setMode }: { currentMode: string, setMode: (m: string) => void }) {
  const navigate = useNavigate();

  return (
    <div className="h-14 border-b border-white/10 bg-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/category')} className="text-gray-400 hover:text-white p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="h-6 w-[1px] bg-white/10" />
        <div className="font-semibold">Rahul Wedding Reception</div>
        <div className="text-xs text-gray-500 flex items-center bg-white/5 px-2 py-1 rounded-md">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" /> Autosaved
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#15171c] p-1 rounded-lg border border-white/5">
        <button 
          onClick={() => setMode('2d')}
          className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentMode === '2d' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <Layers className="w-4 h-4 mr-2" /> 2D
        </button>
        <button 
          onClick={() => setMode('3d')}
          className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentMode === '3d' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <Cuboid className="w-4 h-4 mr-2" /> 3D
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center text-sm px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
          <MonitorPlay className="w-4 h-4 mr-2" /> Client View
        </button>
        <button className="flex items-center text-sm px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </button>
        <button className="flex items-center text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
          <Save className="w-4 h-4 mr-2" /> Save
        </button>
      </div>
    </div>
  );
}
