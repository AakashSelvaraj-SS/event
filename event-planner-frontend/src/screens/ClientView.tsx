import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Box, Text } from '@react-three/drei';

export default function ClientView() {
  const { id } = useParams();

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      
      {/* 3D Environment - Full Screen */}
      <Canvas shadows camera={{ position: [0, 5, 15], fov: 60 }}>
        <OrbitControls makeDefault />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="city" />
        
        {/* Mock Scene */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1c23" />
        </mesh>
        
        <Box args={[20, 1, 8]} position={[0, 0, -10]}>
          <meshStandardMaterial color="#2d3748" />
        </Box>
        <Text position={[0, 3, -13]} fontSize={2} color="white">Stage Area</Text>

        <Box args={[6, 0.5, 6]} position={[-5, 0, 0]}>
          <meshStandardMaterial color="white" opacity={0.6} transparent />
        </Box>
        <Box args={[6, 0.5, 6]} position={[5, 0, 0]}>
          <meshStandardMaterial color="white" opacity={0.6} transparent />
        </Box>
      </Canvas>

      {/* Minimal Presentation UI overlay */}
      <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Rahul Wedding Reception</h1>
          <p className="text-gray-400 font-light mt-1">Interactive 3D Walkthrough</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span className="text-sm font-medium">Presentation Mode</span>
        </div>
      </div>

      {/* Navigation Controls (Mock) */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-1 z-10">
        <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white transition-colors">↑</button>
        <div className="flex gap-1">
          <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white transition-colors">←</button>
          <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white transition-colors">↓</button>
          <button className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white transition-colors">→</button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Powered by Event Planning Studio</div>
      </div>
    </div>
  );
}
