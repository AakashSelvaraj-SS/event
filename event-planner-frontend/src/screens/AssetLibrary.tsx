import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Search, Plus, Filter } from 'lucide-react';
import { assetService } from '../api/assetService';

export default function AssetLibrary() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState<'idle'|'uploading'|'success'>('idle');

  useEffect(() => {
    assetService.getAssets().then(data => {
      setAssets(data as any[]);
      setLoading(false);
    });
  }, []);

  const handleMockUpload = async () => {
    setUploadState('uploading');
    // Mock the 3D generation process
    await new Promise(r => setTimeout(r, 3000));
    setUploadState('success');
    
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadState('idle');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="mr-2 w-5 h-5" /> Back
        </button>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg shadow-indigo-500/20 transition-all"
        >
          <UploadCloud className="w-5 h-5 mr-2" /> Upload New 3D Asset
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Asset Library</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full bg-panel border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="bg-panel border border-white/10 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {assets.map(asset => (
              <div key={asset.id} className="glass-panel rounded-xl overflow-hidden group cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all">
                <div className="aspect-square bg-[#15171c] relative flex items-center justify-center">
                  <span className="text-xs text-gray-500">Preview</span>
                </div>
                <div className="p-4 border-t border-white/5">
                  <h3 className="font-semibold truncate">{asset.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{asset.type}</p>
                </div>
              </div>
            ))}
            
            <div 
              onClick={() => setShowUploadModal(true)}
              className="glass-panel rounded-xl border border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center cursor-pointer transition-all aspect-square min-h-[200px]"
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-400">Add New</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal Mockup */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Upload Image to 3D</h2>
            <p className="text-gray-400 mb-6 text-sm">Upload a photo of your furniture or prop and our AI will generate a 3D model for your event scenes.</p>
            
            {uploadState === 'idle' && (
              <div 
                className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-white/5 transition-all"
                onClick={handleMockUpload}
              >
                <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                <p className="font-medium">Click to select or drag and drop</p>
                <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG (Max 10MB)</p>
              </div>
            )}

            {uploadState === 'uploading' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <h3 className="font-semibold text-lg">AI Generating 3D Model...</h3>
                <p className="text-sm text-gray-400 mt-2">This usually takes about 30 seconds.</p>
              </div>
            )}

            {uploadState === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">Asset Generated Successfully!</h3>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                disabled={uploadState === 'uploading'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
