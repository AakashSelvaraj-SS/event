import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, X, Box as BoxIcon, Palette, Layers } from 'lucide-react';
import AIChatPanel from '../components/AIChatPanel';
import SceneViewer from '../components/SceneViewer';
import EditorToolbar from '../components/EditorToolbar';

export default function MainEditor() {
  const { mode, category } = useParams();
  const navigate = useNavigate();

  // Mock State for Scene
  const [sceneState, setSceneState] = useState({
    capacity: 300,
    chairColor: 'white',
    chairStyle: '1',
    individualChairColors: {} as Record<number, string>,
    hasDJ: false,
    hasRedCarpet: true,
    selectedObject: 'chairs',
    selectedChairId: null as number | null,
    stageDesign: '1',
    sofaColor: 'gold',
    sofaStyle: '1',
    djScreen: '1',
    wallLightStyle: '1',
    chandelierStyle: '1',
    mode: mode || '3d'
  });
  const [showToast, setShowToast] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setShowCameraModal(true);
    setScanStatus('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const captureObject = () => {
    setScanStatus('scanning');
    setTimeout(() => {
      setScanStatus('success');
      // Mock adding the scanned object to the scene
      setTimeout(() => {
        closeCamera();
        // Here we could update scene state to include the scanned object
      }, 2000);
    }, 2500);
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCameraModal(false);
  };

  const handleAIUpdate = (action: any) => {
    if (action.type === 'COLOR_UPDATE') {
      setSceneState(prev => ({ ...prev, chairColor: action.value }));
    }
    if (action.type === 'LAYOUT_UPDATE') {
      setSceneState(prev => ({ ...prev, capacity: action.value }));
    }
    if (action.type === 'ADD_OBJECT') {
      setSceneState(prev => ({ ...prev, hasDJ: true }));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      {/* LEFT: Design Workspace (75%) */}
      <div className="flex flex-col w-[75%] relative">
        <EditorToolbar
          currentMode={sceneState.mode}
          setMode={(m) => setSceneState(prev => ({ ...prev, mode: m }))}
        />

        <div className="flex-1 relative flex">
          {/* Customization Sidebar */}
          <div className="w-64 bg-panel border-r border-white/10 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar z-10">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center"><Palette className="w-4 h-4 mr-2" /> Object Properties</h3>

              <div className="space-y-4">

                {/* Dynamic Menu based on Selected Object */}
                {sceneState.selectedObject === 'chair' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Chairs</h4>
                    <label className="text-xs text-gray-400 block mb-1">Color Theme</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['white', 'red', 'black', 'gold', 'blue', 'green'].map(c => {
                        const bgColors: any = { white: 'bg-white', red: 'bg-red-700', black: 'bg-black', gold: 'bg-yellow-500', blue: 'bg-blue-700', green: 'bg-emerald-600' };
                        const isSelected = sceneState.selectedChairId !== null ? sceneState.individualChairColors[sceneState.selectedChairId] === c || (sceneState.chairColor === c && !sceneState.individualChairColors[sceneState.selectedChairId]) : sceneState.chairColor === c;

                        return (
                          <button key={c} onClick={() => {
                            if (sceneState.selectedChairId !== null) {
                              setSceneState(s => ({ ...s, individualChairColors: { ...s.individualChairColors, [s.selectedChairId!]: c } }));
                            } else {
                              setSceneState(s => ({ ...s, chairColor: c, individualChairColors: {} })); // reset individual when applying to all
                            }
                          }} className={`w-8 h-8 rounded-full ${bgColors[c]} border-2 ${isSelected ? 'border-indigo-500' : 'border-gray-500/50'}`} title={c} />
                        );
                      })}
                    </div>

                    {sceneState.selectedChairId !== null && (
                      <button
                        onClick={() => setSceneState(s => ({ ...s, selectedChairId: null }))}
                        className="w-full mb-3 p-1.5 text-xs rounded border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20"
                      >
                        Currently editing single chair. Click to edit ALL chairs.
                      </button>
                    )}

                    <label className="text-xs text-gray-400 block mb-1">Chair Style (20 Varieties)</label>
                    <select
                      value={sceneState.chairStyle}
                      onChange={(e) => setSceneState(s => ({ ...s, chairStyle: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Style {i + 1}</option>
                      ))}
                    </select>

                    <label className="text-xs text-gray-400 block mb-1">Capacity</label>
                    <input
                      type="range"
                      min="50" max="600" step="50"
                      value={sceneState.capacity}
                      onChange={(e) => setSceneState(s => ({ ...s, capacity: parseInt(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="text-xs text-right mt-1 text-gray-400">{sceneState.capacity} Seats</div>
                  </div>
                )}

                {sceneState.selectedObject === 'stage' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Stage Design</h4>
                    <label className="text-xs text-gray-400 block mb-1">Background Theme (20 Varieties)</label>
                    <select
                      value={sceneState.stageDesign}
                      onChange={(e) => setSceneState(s => ({ ...s, stageDesign: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Background Design {i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                {sceneState.selectedObject === 'sofa' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Stage Sofa</h4>

                    <label className="text-xs text-gray-400 block mb-1">Sofa Color</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'gold' }))} className={`w-8 h-8 rounded-full bg-yellow-500 border-2 ${sceneState.sofaColor === 'gold' ? 'border-indigo-500' : 'border-transparent'}`} title="Gold" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'white' }))} className={`w-8 h-8 rounded-full bg-white border-2 ${sceneState.sofaColor === 'white' ? 'border-indigo-500' : 'border-gray-300'}`} title="White" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'black' }))} className={`w-8 h-8 rounded-full bg-black border-2 ${sceneState.sofaColor === 'black' ? 'border-indigo-500' : 'border-transparent'}`} title="Black" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'red' }))} className={`w-8 h-8 rounded-full bg-red-600 border-2 ${sceneState.sofaColor === 'red' ? 'border-indigo-500' : 'border-transparent'}`} title="Red" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'purple' }))} className={`w-8 h-8 rounded-full bg-purple-600 border-2 ${sceneState.sofaColor === 'purple' ? 'border-indigo-500' : 'border-transparent'}`} title="Purple" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'pink' }))} className={`w-8 h-8 rounded-full bg-pink-400 border-2 ${sceneState.sofaColor === 'pink' ? 'border-indigo-500' : 'border-transparent'}`} title="Pink" />
                      <button onClick={() => setSceneState(s => ({ ...s, sofaColor: 'green' }))} className={`w-8 h-8 rounded-full bg-emerald-600 border-2 ${sceneState.sofaColor === 'green' ? 'border-indigo-500' : 'border-transparent'}`} title="Green" />
                    </div>

                    <label className="text-xs text-gray-400 block mb-1">Select Sofa Style (20 Varieties)</label>
                    <select
                      value={sceneState.sofaStyle}
                      onChange={(e) => setSceneState(s => ({ ...s, sofaStyle: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Sofa Model {i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                {sceneState.selectedObject === 'cooler' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Air Coolers</h4>
                    <label className="text-xs text-gray-400 block mb-1">Fan Speed</label>
                    <input type="range" className="w-full accent-indigo-500" />
                    <button className="w-full mt-2 p-1.5 text-xs rounded border border-red-500/50 text-red-400 hover:bg-red-500/20">Remove Coolers</button>
                  </div>
                )}

                {sceneState.selectedObject === 'light' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Lighting Editor</h4>

                    <label className="text-xs text-gray-400 block mb-1">Chandelier Design (20 Varieties)</label>
                    <select
                      value={sceneState.chandelierStyle}
                      onChange={(e) => setSceneState(s => ({ ...s, chandelierStyle: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Chandelier {i + 1}</option>
                      ))}
                    </select>

                    <label className="text-xs text-gray-400 block mb-1">Wall Light Style (20 Varieties)</label>
                    <select
                      value={sceneState.wallLightStyle}
                      onChange={(e) => setSceneState(s => ({ ...s, wallLightStyle: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Wall Light {i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                {sceneState.selectedObject === 'dj' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">DJ Console</h4>

                    <label className="text-xs text-gray-400 block mb-1">Screen Graphics (20 Varieties)</label>
                    <select
                      value={sceneState.djScreen}
                      onChange={(e) => setSceneState(s => ({ ...s, djScreen: e.target.value }))}
                      className="w-full mb-3 p-2 text-sm rounded bg-white/5 border border-white/10 text-white"
                    >
                      {Array.from({ length: 20 }).map((_, i) => (
                        <option key={i + 1} value={(i + 1).toString()} className="bg-gray-800">Visualizer {i + 1}</option>
                      ))}
                    </select>

                    <button onClick={() => setSceneState(s => ({ ...s, hasDJ: false, selectedObject: '' }))} className="w-full mt-2 p-1.5 text-xs rounded border border-red-500/50 text-red-400 hover:bg-red-500/20">Remove DJ</button>
                  </div>
                )}

                {sceneState.selectedObject === 'light' && (
                  <div className="bg-white/5 p-3 rounded-lg border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h4 className="text-sm font-semibold mb-2">Stage Lighting</h4>
                    <label className="text-xs text-gray-400 block mb-1">Color FX</label>
                    <div className="flex gap-2 mb-2">
                      <button className="w-6 h-6 rounded-full bg-white border border-gray-400" title="Warm White"></button>
                      <button className="w-6 h-6 rounded-full bg-pink-500" title="Pink"></button>
                      <button className="w-6 h-6 rounded-full bg-blue-500" title="Blue"></button>
                      <button className="w-6 h-6 rounded-full bg-purple-500" title="Purple"></button>
                    </div>
                    <label className="text-xs text-gray-400 block mb-1">Beam Intensity</label>
                    <input type="range" className="w-full accent-indigo-500" />
                  </div>
                )}

                {/* Always show Decor option */}
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <h4 className="text-sm font-semibold mb-2">Decor & Audio</h4>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                    <input type="checkbox" checked={sceneState.hasDJ} onChange={(e) => setSceneState(s => ({ ...s, hasDJ: e.target.checked }))} className="mr-3 accent-indigo-500" />
                    Include DJ Setup
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
                    <input type="checkbox" checked={sceneState.hasRedCarpet} onChange={(e) => setSceneState(s => ({ ...s, hasRedCarpet: e.target.checked }))} className="mr-3 accent-indigo-500" />
                    Red Carpet Aisle
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={() => {
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="w-full bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all"
              >
                Apply Changes
              </button>

              <button
                onClick={() => setShowCatalogModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl flex items-center justify-center text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
              >
                <BoxIcon className="w-4 h-4 mr-2" />
                Add New Product
              </button>

              <button
                onClick={startCamera}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white p-2.5 rounded-xl flex items-center justify-center text-sm transition-all"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Real Object
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <SceneViewer
              sceneState={sceneState}
              category={category}
              onSelectObject={(id, subId) => {
                if (id === 'chair' && subId !== undefined) {
                  setSceneState(s => ({ ...s, selectedObject: 'chair', selectedChairId: subId }));
                } else {
                  setSceneState(s => ({ ...s, selectedObject: id, selectedChairId: null }));
                }
              }}
            />

            {showToast && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center animate-bounce z-50">
                <span className="mr-2">✓</span> Changes Applied!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Scan Modal Overlay */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-panel rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#15171c]">
              <h2 className="font-bold flex items-center"><Camera className="w-5 h-5 mr-2 text-accent" /> Add Real-Life Object</h2>
              <button onClick={closeCamera} className="text-gray-400 hover:text-white p-1 bg-white/5 rounded-md"><X className="w-5 h-5" /></button>
            </div>

            <div className="relative bg-black h-96 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${scanStatus !== 'idle' ? 'opacity-50 blur-sm' : ''} transition-all duration-500`}
              />

              {/* Scan Overlay UI */}
              <div className="absolute inset-0 border-[4px] border-indigo-500/30 m-8 rounded-xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {scanStatus === 'idle' && (
                  <div className="text-white/70 bg-black/50 px-4 py-2 rounded-full text-sm backdrop-blur-md">
                    Point camera at the object
                  </div>
                )}
                {scanStatus === 'scanning' && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-t-accent border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
                    <div className="text-white font-bold tracking-widest uppercase bg-black/60 px-4 py-1 rounded backdrop-blur-md">Generating 3D Mesh...</div>
                  </div>
                )}
                {scanStatus === 'success' && (
                  <div className="text-green-400 font-bold text-xl bg-black/60 px-6 py-3 rounded-xl backdrop-blur-md flex items-center">
                    <span className="mr-2">✓</span> Object Imported!
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-[#15171c] flex justify-between items-center">
              <p className="text-sm text-gray-400">Position the item within the frame and capture.</p>
              <button
                onClick={captureObject}
                disabled={scanStatus !== 'idle'}
                className="bg-accent hover:bg-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
              >
                Capture to 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Asset Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-panel rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#15171c]">
              <h2 className="font-bold text-lg flex items-center"><BoxIcon className="w-5 h-5 mr-2 text-indigo-400" /> 3D Asset Catalog</h2>
              <button onClick={() => setShowCatalogModal(false)} className="text-gray-400 hover:text-white p-1 bg-white/5 rounded-md transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-3 gap-6">
              {[
                { name: "Premium Sofa Set", type: "Furniture", image: "🛋️" },
                { name: "Round Banquet Table", type: "Furniture", image: "🍽️" },
                { name: "Crystal Chandelier", type: "Lighting", image: "✨" },
                { name: "Floral Archway", type: "Decor", image: "🌸" },
                { name: "LED Dance Floor", type: "Entertainment", image: "🕺" },
                { name: "Photo Booth", type: "Entertainment", image: "📸" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="h-32 bg-black/50 rounded-lg mb-4 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    {item.image}
                  </div>
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{item.type}</p>
                  <button onClick={() => {
                    setShowCatalogModal(false);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }} className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 py-2 rounded-lg text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Add to Scene
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RIGHT: AI Assistant (25%) */}
      <div className="w-[25%] h-full">
        <AIChatPanel updateScene={handleAIUpdate} />
      </div>

    </div>
  );
}
