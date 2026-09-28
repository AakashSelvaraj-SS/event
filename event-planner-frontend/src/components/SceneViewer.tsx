import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Box, RoundedBox, Sphere, Cylinder, Torus, Plane, Text, SoftShadows, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function createEqualizerTexture(seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 128);
  
  for (let i = 0; i < 20; i++) {
    const height = (Math.sin(i * 0.5 + seed) * 0.5 + 0.5) * 100 + 10;
    const gradient = ctx.createLinearGradient(0, 128, 0, 128 - height);
    if (seed % 3 === 0) {
      gradient.addColorStop(0, '#ef4444'); gradient.addColorStop(1, '#22c55e');
    } else if (seed % 3 === 1) {
      gradient.addColorStop(0, '#3b82f6'); gradient.addColorStop(1, '#a855f7');
    } else {
      gradient.addColorStop(0, '#eab308'); gradient.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(i * 12 + 8, 128 - height, 8, height);
  }
  return canvas;
}

function DistanceMarker({ objectPos, cameraPos, label, onClick, threshold = 12 }: { objectPos: [number, number, number], cameraPos: [number, number, number], label: string, onClick: () => void, threshold?: number }) {
  const dist = new THREE.Vector3(...objectPos).distanceTo(new THREE.Vector3(...cameraPos));
  const isClose = dist < threshold; 
  
  if (!isClose) return null;
  return (
    <Html position={[0, 2, 0]} center zIndexRange={[100, 0]}>
      <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }} 
        title={`Edit ${label}`}
        className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full text-xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse pointer-events-auto backdrop-blur-md border border-white/50 transition-all hover:scale-110"
      >
        +
      </button>
    </Html>
  );
}

function CameraManager({ targetPosition }: { targetPosition: [number, number, number] }) {
  const vec = new THREE.Vector3();
  useFrame((state) => {
    vec.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    state.camera.position.lerp(vec, 0.05); // Smooth glide step-by-step
  });
  return null;
}

function HallDemoScene({ sceneState, onSelectObject, cameraPos }: { sceneState: any, onSelectObject: (id: string, subId?: number) => void, cameraPos: [number, number, number] }) {
  const getChairColor = (c: string) => c === 'red' ? '#991b1b' : c === 'black' ? '#1f2937' : c === 'gold' ? '#fbbf24' : c === 'blue' ? '#1d4ed8' : c === 'green' ? '#059669' : '#f3f4f6';
  const getSofaColor = (c: string) => c === 'white' ? '#f3f4f6' : c === 'black' ? '#1f2937' : c === 'red' ? '#dc2626' : c === 'purple' ? '#9333ea' : c === 'pink' ? '#f472b6' : c === 'green' ? '#059669' : '#fbbf24';
  
  const globalChairColor = getChairColor(sceneState.chairColor);
  const sofaColor = getSofaColor(sceneState.sofaColor);
  
  const stageDesignNum = parseInt(sceneState.stageDesign) || 1;
  const sofaStyleNum = parseInt(sceneState.sofaStyle) || 1;
  const chairStyleNum = parseInt(sceneState.chairStyle) || 1;
  const djScreenNum = parseInt(sceneState.djScreen) || 1;
  const wallLightNum = parseInt(sceneState.wallLightStyle) || 1;
  const chandelierNum = parseInt(sceneState.chandelierStyle) || 1;
  
  const bgColors = ['#f472b6', '#1e3a8a', '#d97706', '#10b981', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9'];
  const stageBgColor = bgColors[stageDesignNum % bgColors.length];
  
  return (
    <group>
      {/* Floor and Walls */}
      <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#0f1115" roughness={0.1} metalness={0.2} />
        </mesh>
        
        {/* Contact shadow for ultra realism */}
        <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.6} far={10} color="#000000" />
        
        {/* Back Wall */}
        <mesh position={[0, 9.5, -25]} receiveShadow>
          <boxGeometry args={[50, 20, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        {/* Front Wall (Split into 3 pieces to make a hole for the entrance) */}
        {/* Left piece */}
        <mesh position={[-14.5, 9.5, 25]} receiveShadow>
          <boxGeometry args={[21, 20, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        {/* Right piece */}
        <mesh position={[14.5, 9.5, 25]} receiveShadow>
          <boxGeometry args={[21, 20, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        {/* Top piece over the door */}
        <mesh position={[0, 15, 25]} receiveShadow>
          <boxGeometry args={[8, 9, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        {/* Left Wall */}
        <mesh position={[-25, 9.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[50, 20, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>
        {/* Right Wall */}
        <mesh position={[25, 9.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[50, 20, 1]} />
          <meshStandardMaterial color="#2d3748" />
        </mesh>

        {/* Wall Lights (Left Wall) */}
        {Array.from({ length: 4 + (wallLightNum % 3) }).map((_, i) => (
          <group key={`lw-${i}`} position={[-24.5, 7 + (wallLightNum % 3), -15 + i * (10 - (wallLightNum%3))]}>
            <Box args={[0.2, 1, 0.5]} position={[0, 0, 0]}><meshStandardMaterial color={wallLightNum % 2 === 0 ? "#b45309" : "#1f2937"} /></Box>
            
            {wallLightNum % 3 === 0 && (
              <Sphere args={[0.4, 16, 16]} position={[0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Sphere>
            )}
            {wallLightNum % 3 === 1 && (
              <Cylinder args={[0.2, 0.2, 0.8, 16]} position={[0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Cylinder>
            )}
            {wallLightNum % 3 === 2 && (
              <Box args={[0.3, 0.8, 0.3]} position={[0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Box>
            )}
            <pointLight position={[1, 0.5, 0]} intensity={2} color={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} distance={15} />
          </group>
        ))}

        {/* Wall Lights (Right Wall) */}
        {Array.from({ length: 4 + (wallLightNum % 3) }).map((_, i) => (
          <group key={`rw-${i}`} position={[24.5, 7 + (wallLightNum % 3), -15 + i * (10 - (wallLightNum%3))]}>
            <Box args={[0.2, 1, 0.5]} position={[0, 0, 0]}><meshStandardMaterial color={wallLightNum % 2 === 0 ? "#b45309" : "#1f2937"} /></Box>
            
            {wallLightNum % 3 === 0 && (
              <Sphere args={[0.4, 16, 16]} position={[-0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Sphere>
            )}
            {wallLightNum % 3 === 1 && (
              <Cylinder args={[0.2, 0.2, 0.8, 16]} position={[-0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Cylinder>
            )}
            {wallLightNum % 3 === 2 && (
              <Box args={[0.3, 0.8, 0.3]} position={[-0.2, 0.5, 0]}>
                <meshPhysicalMaterial color="#fef08a" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} emissiveIntensity={2} />
              </Box>
            )}
            <pointLight position={[-1, 0.5, 0]} intensity={2} color={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][wallLightNum % 4]} distance={15} />
          </group>
        ))}
      </group>

      {/* Outdoor Space beyond the Entrance */}
      <group position={[0, 0, 35]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 50]} />
          <meshStandardMaterial color="#22c55e" roughness={0.9} /> {/* Green grass */}
        </mesh>
        <mesh position={[0, 10, 0]}>
          <sphereGeometry args={[80, 32, 32, 0, Math.PI, 0, Math.PI/2]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.BackSide} /> {/* Blue sky */}
        </mesh>
      </group>

      {/* Traditional Indian Entrance Gate */}
      <group position={[0, 0, 24]}>
        <DistanceMarker objectPos={[0, 5, 24]} cameraPos={cameraPos} label="Entrance" onClick={() => onSelectObject('gate')} threshold={8} />
        {/* Left Pillar */}
        <Cylinder args={[0.8, 0.8, 12]} position={[-4, 6, 0]} castShadow>
          <meshPhysicalMaterial color="#b45309" roughness={0.7} metalness={0.2} />
        </Cylinder>
        {/* Right Pillar */}
        <Cylinder args={[0.8, 0.8, 12]} position={[4, 6, 0]} castShadow>
          <meshPhysicalMaterial color="#b45309" roughness={0.7} metalness={0.2} />
        </Cylinder>
        {/* Arch top */}
        <Torus args={[4, 0.8, 16, 64, Math.PI]} rotation={[0, 0, 0]} position={[0, 12, 0]} castShadow>
          <meshPhysicalMaterial color="#d97706" roughness={0.4} metalness={0.8} />
        </Torus>
        {/* Inner Arch Details */}
        <Torus args={[3, 0.2, 16, 32, Math.PI]} position={[0, 11, 0.5]} castShadow>
          <meshPhysicalMaterial color="#fcd34d" metalness={1} roughness={0.2} />
        </Torus>
        
        {/* Indian Domes / Kalash on top */}
        <Sphere args={[1.5, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} position={[-4, 12, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Sphere>
        <Cylinder args={[0, 0.5, 1.5, 16]} position={[-4, 13.5, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Cylinder>
        
        <Sphere args={[1.5, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} position={[4, 12, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Sphere>
        <Cylinder args={[0, 0.5, 1.5, 16]} position={[4, 13.5, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Cylinder>
        
        {/* Main Center Dome */}
        <Sphere args={[2, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} position={[0, 14, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Sphere>
        <Cylinder args={[0, 0.5, 2]} position={[0, 15.5, 0]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* Gate Doors (Open) */}
        <Box args={[3.8, 10, 0.2]} position={[-3.8, 5, -1.5]} rotation={[0, -Math.PI/3, 0]} castShadow>
          <meshPhysicalMaterial color="#78350f" roughness={0.9} />
        </Box>
        <Box args={[3.8, 10, 0.2]} position={[3.8, 5, -1.5]} rotation={[0, Math.PI/3, 0]} castShadow>
          <meshPhysicalMaterial color="#78350f" roughness={0.9} />
        </Box>
      </group>
      {/* Red Carpet Aisle */}
      {sceneState.hasRedCarpet && (
        <mesh position={[0, -0.48, 10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3, 30]} />
          <meshPhysicalMaterial color="#991b1b" roughness={1} clearcoat={0} />
        </mesh>
      )}

      {/* Indian Styled Stage Area */}
      <group position={[0, 0, -15]} onClick={(e) => { e.stopPropagation(); onSelectObject('stage'); }}>
        <DistanceMarker objectPos={[0, 0, -15]} cameraPos={cameraPos} label="Stage" onClick={() => onSelectObject('stage')} />
        {/* Main Elevation */}
        <RoundedBox args={[28, 1.5, 14]} position={[0, 0.25, 0]} radius={0.1} smoothness={4} receiveShadow castShadow>
          <meshPhysicalMaterial color="#991b1b" roughness={0.9} clearcoat={0.1} /> {/* Red carpet style */}
        </RoundedBox>
        
        {/* Background Design */}
        <group position={[0, 5, -6]}>
          <RoundedBox args={[19, 10, 0.5]} radius={0.2} smoothness={4} receiveShadow castShadow>
            <meshPhysicalMaterial color={stageBgColor} roughness={0.3} metalness={0.8} clearcoat={0.5} />
          </RoundedBox>
          
          {/* Procedural Pattern based on stageDesignNum */}
          {stageDesignNum % 4 === 0 && Array.from({ length: 40 }).map((_, i) => (
            <Sphere key={i} args={[0.3 + (stageDesignNum * 0.01), 16, 16]} position={[(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 8, 0.3]} castShadow>
              <meshPhysicalMaterial color={['#fb7185', '#fde047', '#ffffff'][i % 3]} roughness={0.4} clearcoat={0.5} />
            </Sphere>
          ))}

          {stageDesignNum % 4 === 1 && Array.from({ length: 5 + (stageDesignNum % 5) }).map((_, i) => (
            <Box key={i} args={[0.2 + (stageDesignNum * 0.05), 8, 0.1]} position={[-8 + (i * 4), 0, 0.3]} castShadow>
              <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.1} />
            </Box>
          ))}
          
          {stageDesignNum % 4 === 2 && (
            <group position={[0, 0, 0.3]}>
              {Array.from({ length: 11 }).map((_, i) => (
                <Cylinder key={`v${i}`} args={[0.05, 0.05, 8]} position={[-10 + (i * 2), 0, 0]} castShadow>
                  <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.2} />
                </Cylinder>
              ))}
              {Array.from({ length: 5 + (stageDesignNum % 5) }).map((_, i) => (
                <Cylinder key={`h${i}`} args={[0.05, 0.05, 20]} rotation={[0, 0, Math.PI/2]} position={[0, -3 + (i * 1.5), 0]} castShadow>
                  <meshPhysicalMaterial color="#fbbf24" metalness={1} roughness={0.2} />
                </Cylinder>
              ))}
            </group>
          )}

          {stageDesignNum % 4 === 3 && Array.from({ length: 7 + (stageDesignNum % 5) }).map((_, i) => (
            <Box key={i} args={[0.5, 9, 0.2]} position={[-9 + (i * 3), 0, 0.4]} castShadow>
              <meshPhysicalMaterial color={stageBgColor} emissive={stageBgColor} emissiveIntensity={2} roughness={0.1} />
            </Box>
          ))}
        </group>
        
        {/* Sofa on Stage */}
        <group position={[0, 1.5, -2]} onClick={(e) => { e.stopPropagation(); onSelectObject('sofa'); }}>
          <DistanceMarker objectPos={[0, 1.5, -17]} cameraPos={cameraPos} label="Sofa" onClick={() => onSelectObject('sofa')} />
          
          {/* Procedural Sofa Structure based on sofaStyleNum */}
          <group>
            {/* Seat */}
            <RoundedBox args={[3.8 + (sofaStyleNum * 0.02), 0.8 + (sofaStyleNum % 3) * 0.2, 1.4]} position={[0, 0.6, 0]} radius={0.1 + (sofaStyleNum % 4) * 0.05} smoothness={4} castShadow>
              <meshPhysicalMaterial color={sofaColor} roughness={0.3 + (sofaStyleNum * 0.02)} clearcoat={sofaStyleNum % 2 === 0 ? 1 : 0} />
            </RoundedBox>
            
            {/* Backrest */}
            {sofaStyleNum % 3 !== 2 && (
              <RoundedBox args={[3.8 + (sofaStyleNum * 0.02), 1 + (sofaStyleNum % 4) * 0.3, 0.4]} position={[0, 1.2 + (sofaStyleNum % 3)*0.2, -0.5]} radius={0.1 + (sofaStyleNum % 3) * 0.1} smoothness={4} castShadow>
                <meshPhysicalMaterial color={sofaColor} roughness={0.3 + (sofaStyleNum * 0.02)} clearcoat={sofaStyleNum % 2 === 0 ? 1 : 0} />
              </RoundedBox>
            )}
            {sofaStyleNum % 3 === 2 && (
               <Cylinder args={[0.6 + (sofaStyleNum % 3)*0.1, 0.6 + (sofaStyleNum % 3)*0.1, 3.8]} rotation={[0, 0, Math.PI/2]} position={[0, 1.2, -0.4]} castShadow>
                <meshPhysicalMaterial color={sofaColor} roughness={0.3} />
              </Cylinder>
            )}

            {/* Armrests */}
            {sofaStyleNum % 2 === 0 ? (
              <>
                <RoundedBox args={[0.4 + (sofaStyleNum%3)*0.1, 1, 1.5]} position={[-2, 0.9, 0]} radius={0.1} smoothness={4} castShadow><meshPhysicalMaterial color={sofaColor} /></RoundedBox>
                <RoundedBox args={[0.4 + (sofaStyleNum%3)*0.1, 1, 1.5]} position={[2, 0.9, 0]} radius={0.1} smoothness={4} castShadow><meshPhysicalMaterial color={sofaColor} /></RoundedBox>
              </>
            ) : (
              <>
                <Sphere args={[0.6 + (sofaStyleNum%3)*0.1, 32, 32]} position={[-2, 0.9, 0]} castShadow><meshPhysicalMaterial color={sofaColor} /></Sphere>
                <Sphere args={[0.6 + (sofaStyleNum%3)*0.1, 32, 32]} position={[2, 0.9, 0]} castShadow><meshPhysicalMaterial color={sofaColor} /></Sphere>
              </>
            )}
          </group>
        </group>

        {/* Pillars */}
        <Cylinder args={[0.4, 0.4, 10, 32]} position={[-10, 5, -2]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} clearcoat={1} />
        </Cylinder>
        <Cylinder args={[0.4, 0.4, 10, 32]} position={[10, 5, -2]} castShadow>
          <meshPhysicalMaterial color="#fbbf24" metalness={0.9} roughness={0.1} clearcoat={1} />
        </Cylinder>
        
        {/* Top Arch */}
        <RoundedBox args={[24, 1.5, 3]} position={[0, 10, -2]} radius={0.2} smoothness={4} receiveShadow castShadow>
          <meshPhysicalMaterial color="#b45309" metalness={0.7} roughness={0.2} clearcoat={0.5} />
        </RoundedBox>

        {/* Hanging Chandelier */}
        <group position={[0, 7.5, -2]}>
          <DistanceMarker objectPos={[0, 7.5, -15]} cameraPos={cameraPos} label="Chandelier" onClick={() => onSelectObject('light')} threshold={15} />
          {/* Chain */}
          <Cylinder args={[0.05, 0.05, 2]} position={[0, 1, 0]}><meshStandardMaterial color={chandelierNum % 2 === 0 ? "#fbbf24" : "#94a3b8"} metalness={1} /></Cylinder>
          
          {/* Main Body (Tiers based on chandelierNum) */}
          {chandelierNum % 3 === 0 && (
            <>
              <Torus args={[1.5 + (chandelierNum % 3) * 0.5, 0.1, 16, 64]} rotation={[Math.PI/2, 0, 0]}><meshStandardMaterial color="#fbbf24" metalness={1} /></Torus>
              <Torus args={[0.8, 0.1, 16, 64]} position={[0, -0.5, 0]} rotation={[Math.PI/2, 0, 0]}><meshStandardMaterial color="#fbbf24" metalness={1} /></Torus>
            </>
          )}
          {chandelierNum % 3 === 1 && (
            <Cylinder args={[1.5, 1.2, 0.8, 32]} rotation={[0, 0, 0]}><meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.5} transparent roughness={0.1} /></Cylinder>
          )}
          {chandelierNum % 3 === 2 && (
            <>
              <Box args={[3, 0.1, 3]} position={[0, 0, 0]}><meshStandardMaterial color="#333" /></Box>
              <Box args={[2, 0.1, 2]} position={[0, -0.5, 0]}><meshStandardMaterial color="#333" /></Box>
            </>
          )}

          {/* Light Bulbs */}
          {Array.from({ length: 6 + (chandelierNum % 5) * 2 }).map((_, i, arr) => (
            <Sphere key={`b1-${i}`} args={[0.15, 16, 16]} position={[
              (1.5 + (chandelierNum%3)*0.2) * Math.cos(i * (Math.PI*2/arr.length)), 
              chandelierNum % 3 === 1 ? -0.4 : 0.2, 
              (1.5 + (chandelierNum%3)*0.2) * Math.sin(i * (Math.PI*2/arr.length))
            ]}>
              <meshPhysicalMaterial color="#ffffff" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][chandelierNum % 4]} emissiveIntensity={3} />
            </Sphere>
          ))}
          {chandelierNum % 3 !== 1 && Array.from({ length: 4 + (chandelierNum % 3) * 2 }).map((_, i, arr) => (
            <Sphere key={`b2-${i}`} args={[0.15, 16, 16]} position={[
              0.8 * Math.cos(i * (Math.PI*2/arr.length)), 
              -0.3, 
              0.8 * Math.sin(i * (Math.PI*2/arr.length))
            ]}>
              <meshPhysicalMaterial color="#ffffff" emissive={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][chandelierNum % 4]} emissiveIntensity={3} />
            </Sphere>
          ))}
          <pointLight intensity={3} color={['#fde047', '#60a5fa', '#f472b6', '#ffffff'][chandelierNum % 4]} distance={20} />
        </group>

        {/* Stage Lights on top */}
        <group position={[-8, 11, -1]}>
          <DistanceMarker objectPos={[-8, 11, -16]} cameraPos={cameraPos} label="Light" onClick={() => onSelectObject('light')} />
          <Cylinder args={[0.3, 0.3, 0.5]} rotation={[Math.PI/4, 0, 0]}><meshStandardMaterial color="#111"/></Cylinder>
          <spotLight position={[0, 0, 0]} angle={0.5} penumbra={0.5} intensity={5} color="#fff" target-position={[0, -10, 5]} castShadow />
        </group>
        <group position={[8, 11, -1]}>
          <DistanceMarker objectPos={[8, 11, -16]} cameraPos={cameraPos} label="Light" onClick={() => onSelectObject('light')} />
          <Cylinder args={[0.3, 0.3, 0.5]} rotation={[Math.PI/4, 0, 0]}><meshStandardMaterial color="#111"/></Cylinder>
          <spotLight position={[0, 0, 0]} angle={0.5} penumbra={0.5} intensity={5} color="#fff" target-position={[0, -10, 5]} castShadow />
        </group>
        
        {/* Air Coolers on the sides */}
        <group position={[-14, 0, -2]} onClick={(e) => { e.stopPropagation(); onSelectObject('cooler'); }}>
          <DistanceMarker objectPos={[-14, 0, -15]} cameraPos={cameraPos} label="Cooler" onClick={() => onSelectObject('cooler')} />
          {/* Tower Fan Body */}
          <Box args={[1.2, 5, 1]} position={[0, 2.5, 0]} castShadow>
            <meshPhysicalMaterial color="#ffffff" metalness={0.2} roughness={0.5} />
          </Box>
          <Box args={[1, 4.5, 1.1]} position={[0, 2.5, 0.1]}>
            <meshStandardMaterial color="#111" />
          </Box>
          {/* Vertical Louvers */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} args={[0.05, 4.2, 0.1]} position={[-0.35 + i * 0.1, 2.5, 0.6]}>
              <meshStandardMaterial color="#4b5563" />
            </Box>
          ))}
          {/* Top Panel */}
          <Box args={[1.2, 0.2, 1]} position={[0, 5.1, 0]}>
            <meshPhysicalMaterial color="#9ca3af" roughness={0.3} />
          </Box>
        </group>

        <group position={[14, 0, -2]} onClick={(e) => { e.stopPropagation(); onSelectObject('cooler'); }}>
          <DistanceMarker objectPos={[14, 0, -15]} cameraPos={cameraPos} label="Cooler" onClick={() => onSelectObject('cooler')} />
          {/* Tower Fan Body */}
          <Box args={[1.2, 5, 1]} position={[0, 2.5, 0]} castShadow>
            <meshPhysicalMaterial color="#ffffff" metalness={0.2} roughness={0.5} />
          </Box>
          <Box args={[1, 4.5, 1.1]} position={[0, 2.5, 0.1]}>
            <meshStandardMaterial color="#111" />
          </Box>
          {/* Vertical Louvers */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} args={[0.05, 4.2, 0.1]} position={[-0.35 + i * 0.1, 2.5, 0.6]}>
              <meshStandardMaterial color="#4b5563" />
            </Box>
          ))}
          {/* Top Panel */}
          <Box args={[1.2, 0.2, 1]} position={[0, 5.1, 0]}>
            <meshPhysicalMaterial color="#9ca3af" roughness={0.3} />
          </Box>
        </group>
      </group>

      {/* Render Actual Chairs (Max 300 for Demo) */}
      <group position={[0, 0, 5]}>
        {Array.from({ length: Math.min(sceneState.capacity, 300) }).map((_, i) => {
          // Layout in a grid: 15 columns left, 15 columns right.
          const isLeft = i % 2 === 0;
          const halfIndex = Math.floor(i / 2);
          const cols = 15;
          const row = Math.floor(halfIndex / cols);
          const col = halfIndex % cols;
          
          const xOffset = isLeft ? -2 - (col * 1.2) : 2 + (col * 1.2);
          const zOffset = row * 1.5;
          
          return (
            <group key={i} position={[xOffset, 0, zOffset]} rotation={[0, Math.PI, 0]} onClick={(e) => { e.stopPropagation(); onSelectObject('chair', i); }}>
              <DistanceMarker objectPos={[xOffset, 0, zOffset + 5]} cameraPos={cameraPos} label="Chair" onClick={() => onSelectObject('chair', i)} threshold={4} />
              
              <group>
                <RoundedBox 
                  args={[0.6 + (chairStyleNum % 4) * 0.05, 0.05 + (chairStyleNum % 3) * 0.05, 0.6 + (chairStyleNum % 4) * 0.05]} 
                  position={[0, 0.5, 0]} 
                  radius={0.02 * (chairStyleNum % 5)} 
                  smoothness={2} castShadow
                >
                  <meshPhysicalMaterial color={sceneState.individualChairColors?.[i] ? getChairColor(sceneState.individualChairColors[i]) : globalChairColor} roughness={0.2} metalness={0.1} clearcoat={0.8} />
                </RoundedBox>

                <RoundedBox 
                  args={[0.6 + (chairStyleNum % 4) * 0.05, 0.6 + (chairStyleNum % 6) * 0.1, 0.05 + (chairStyleNum % 3) * 0.05]} 
                  position={[0, 0.9 + (chairStyleNum % 3) * 0.05, -0.3]} 
                  radius={0.02 * (chairStyleNum % 5)} 
                  smoothness={2} castShadow
                >
                  <meshPhysicalMaterial color={sceneState.individualChairColors?.[i] ? getChairColor(sceneState.individualChairColors[i]) : globalChairColor} roughness={0.2} metalness={0.1} clearcoat={0.8} />
                </RoundedBox>
                
                {/* Legs vary by style */}
                {chairStyleNum % 2 === 0 ? (
                  <>
                    <Cylinder args={[0.04, 0.04, 0.5]} position={[-0.3, 0.25, -0.3]} castShadow><meshPhysicalMaterial color="#e5e7eb" /></Cylinder>
                    <Cylinder args={[0.04, 0.04, 0.5]} position={[0.3, 0.25, -0.3]} castShadow><meshPhysicalMaterial color="#e5e7eb" /></Cylinder>
                    <Cylinder args={[0.04, 0.04, 0.5]} position={[-0.3, 0.25, 0.3]} castShadow><meshPhysicalMaterial color="#e5e7eb" /></Cylinder>
                    <Cylinder args={[0.04, 0.04, 0.5]} position={[0.3, 0.25, 0.3]} castShadow><meshPhysicalMaterial color="#e5e7eb" /></Cylinder>
                  </>
                ) : (
                  <>
                    <Cylinder args={[0.03, 0.03, 0.6]} position={[-0.3, 0.25, 0]} rotation={[0.4, 0, 0]} castShadow><meshStandardMaterial color="#666" /></Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.6]} position={[0.3, 0.25, 0]} rotation={[0.4, 0, 0]} castShadow><meshStandardMaterial color="#666" /></Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.6]} position={[-0.3, 0.25, 0]} rotation={[-0.4, 0, 0]} castShadow><meshStandardMaterial color="#666" /></Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.6]} position={[0.3, 0.25, 0]} rotation={[-0.4, 0, 0]} castShadow><meshStandardMaterial color="#666" /></Cylinder>
                  </>
                )}
              </group>
            </group>
          );
        })}
      </group>

      {/* DJ Setup & Audio Equipment Conditionally Rendered */}
      {sceneState.hasDJ && (
        <group>
          {/* Main DJ Console */}
          <group position={[18, 0, -10]} onClick={(e) => { e.stopPropagation(); onSelectObject('dj'); }}>
            <DistanceMarker objectPos={[18, 0, -10]} cameraPos={cameraPos} label="DJ" onClick={() => onSelectObject('dj')} threshold={6} />
            
            {/* DJ Floor Panel (Lit) */}
            <Box args={[6, 0.1, 4]} position={[0, 0.05, 0]}>
              <meshPhysicalMaterial color="#111" roughness={0.1} metalness={0.9} />
            </Box>
            
            {/* DJ LED Floor Edge Lights */}
            <Box args={[6.2, 0.12, 4.2]} position={[0, 0.04, 0]}>
              <meshPhysicalMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} />
            </Box>

            {/* Background Equalizer Screen */}
            <group position={[0, 2, -1.8]}>
              <Box args={[5, 3, 0.2]} position={[0, 0, 0]} castShadow>
                <meshStandardMaterial color="#000" />
              </Box>
              <Plane args={[4.8, 2.8]} position={[0, 0, 0.11]}>
                <meshBasicMaterial color="#3b82f6" map={new THREE.CanvasTexture(createEqualizerTexture(djScreenNum))} />
              </Plane>
            </group>
            
            {/* Table */}
            <RoundedBox args={[3.5, 1, 1.5]} position={[0, 0.5, 0]} radius={0.05} smoothness={4} castShadow>
              <meshPhysicalMaterial color="#111827" metalness={0.9} roughness={0.5} />
            </RoundedBox>
            
            {/* Left Turntable */}
            <Box args={[0.8, 0.1, 0.8]} position={[-0.8, 1.05, 0]} castShadow><meshStandardMaterial color="#374151" /></Box>
            <Cylinder args={[0.3, 0.3, 0.12, 32]} position={[-0.8, 1.05, 0]}><meshStandardMaterial color="#111" /></Cylinder>
            
            {/* Right Turntable */}
            <Box args={[0.8, 0.1, 0.8]} position={[0.8, 1.05, 0]} castShadow><meshStandardMaterial color="#374151" /></Box>
            <Cylinder args={[0.3, 0.3, 0.12, 32]} position={[0.8, 1.05, 0]}><meshStandardMaterial color="#111" /></Cylinder>
            
            {/* Mixer & Knobs */}
            <Box args={[0.6, 0.1, 0.8]} position={[0, 1.05, 0]} castShadow><meshStandardMaterial color="#4b5563" /></Box>
            <Cylinder args={[0.04, 0.04, 0.15]} position={[-0.15, 1.12, 0.2]}><meshStandardMaterial color="#ef4444" /></Cylinder>
            <Cylinder args={[0.04, 0.04, 0.15]} position={[0.15, 1.12, 0.2]}><meshStandardMaterial color="#3b82f6" /></Cylinder>
            
            {/* Laptop */}
            <group position={[0, 1.05, -0.3]}>
              <Box args={[0.6, 0.05, 0.5]} position={[0, 0, 0]}><meshStandardMaterial color="#d1d5db" /></Box>
              <Box args={[0.6, 0.4, 0.05]} position={[0, 0.2, -0.2]} rotation={[0.2, 0, 0]}><meshStandardMaterial color="#d1d5db" /></Box>
              <Box args={[0.55, 0.35, 0.06]} position={[0, 0.2, -0.19]} rotation={[0.2, 0, 0]}><meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.5} /></Box>
            </group>

            <Text position={[0, 4, 0]} fontSize={0.4} color="#8b5cf6" emissiveIntensity={2}>DJ Setup</Text>
          </group>

          {/* Left Speaker Stack */}
          <group position={[-16, 0, -10]}>
            <DistanceMarker objectPos={[-16, 0, -10]} cameraPos={cameraPos} label="Audio" onClick={() => onSelectObject('dj')} threshold={6} />
            <RoundedBox args={[2, 2, 2]} position={[0, 1, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#111" roughness={0.8} /></RoundedBox>
            <RoundedBox args={[1.8, 1.5, 1.8]} position={[0, 2.75, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#171717" roughness={0.8} /></RoundedBox>
            <RoundedBox args={[1.5, 1.5, 1.5]} position={[0, 4.25, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#222" roughness={0.8} /></RoundedBox>
          </group>

          {/* Right Speaker Stack */}
          <group position={[16, 0, -10]}>
            <DistanceMarker objectPos={[16, 0, -10]} cameraPos={cameraPos} label="Audio" onClick={() => onSelectObject('dj')} threshold={6} />
            <RoundedBox args={[2, 2, 2]} position={[0, 1, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#111" roughness={0.8} /></RoundedBox>
            <RoundedBox args={[1.8, 1.5, 1.8]} position={[0, 2.75, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#171717" roughness={0.8} /></RoundedBox>
            <RoundedBox args={[1.5, 1.5, 1.5]} position={[0, 4.25, 0]} radius={0.1} castShadow><meshPhysicalMaterial color="#222" roughness={0.8} /></RoundedBox>
          </group>
        </group>
      )}

      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 10]} intensity={2.5} castShadow shadow-mapSize={[4096, 4096]} shadow-bias={-0.0001} />
      <Environment preset="night" background blur={0.8} />
    </group>
  );
}

export default function SceneViewer({ sceneState, category, onSelectObject }: { sceneState: any, category?: string, onSelectObject?: (id: string, subId?: number) => void }) {
  
  if (sceneState.mode === '2d') {
    return (
      <div className="w-full h-full bg-[#111318] flex items-center justify-center relative overflow-hidden">
        {/* Mock 2D Grid Background */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }} />
        
        {/* Mock 2D View rendering of the same state */}
        <div className="relative w-[800px] h-[600px] border-2 border-indigo-500/20 bg-background rounded-lg shadow-2xl overflow-hidden p-8">
          <div className="w-full h-24 bg-panel rounded-md flex items-center justify-center mb-8 border border-white/5">
            Stage Area
          </div>
          
          <div className="flex justify-between px-12">
            <div className={`w-48 h-64 rounded-md border-2 border-dashed flex items-center justify-center`} style={{ borderColor: sceneState.chairColor === 'red' ? '#ef4444' : '#ffffff55' }}>
              {Math.floor(sceneState.capacity / 2)} Chairs
            </div>
            
            {sceneState.hasDJ && (
              <div className="w-32 h-24 bg-accent/20 border border-accent rounded-md flex items-center justify-center absolute right-8 top-8">
                DJ Area
              </div>
            )}
            
            <div className={`w-48 h-64 rounded-md border-2 border-dashed flex items-center justify-center`} style={{ borderColor: sceneState.chairColor === 'red' ? '#ef4444' : '#ffffff55' }}>
              {Math.floor(sceneState.capacity / 2)} Chairs
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3D Mode - First Person Navigation State
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 2, 15]);

  const calculateHeight = (x: number, z: number) => {
    // Stage bounds: x from -14 to 14, z from -8 to -22
    if (x >= -14 && x <= 14 && z <= -8 && z >= -22) {
      return 3.5; // Elevate view by 1.5 units when on stage
    }
    return 2; // Floor level
  };

  const moveForward = () => setCameraPos(prev => [prev[0], calculateHeight(prev[0], prev[2] - 2), prev[2] - 2]);
  const moveBackward = () => setCameraPos(prev => [prev[0], calculateHeight(prev[0], prev[2] + 2), prev[2] + 2]);
  const moveLeft = () => setCameraPos(prev => [prev[0] - 2, calculateHeight(prev[0] - 2, prev[2]), prev[2]]);
  const moveRight = () => setCameraPos(prev => [prev[0] + 2, calculateHeight(prev[0] + 2, prev[2]), prev[2]]);

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }} camera={{ position: [0, 2, 15], fov: 60 }}>
        <SoftShadows size={20} samples={32} focus={0.7} />
        <CameraManager targetPosition={cameraPos} />
        <OrbitControls makeDefault target={[cameraPos[0], cameraPos[1], cameraPos[2] - 0.1]} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
        
        <HallDemoScene sceneState={sceneState} onSelectObject={onSelectObject || (() => {})} cameraPos={cameraPos} />

        {/* Post Processing for hyper-realism */}
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.4} />
          <Vignette eskil={false} offset={0.3} darkness={0.6} />
        </EffectComposer>
      </Canvas>

      {/* First Person Navigation Overlay Controls */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-1 z-20">
        <button onClick={moveForward} className="w-12 h-12 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-white font-bold transition-all shadow-lg active:scale-95">↑</button>
        <div className="flex gap-1">
          <button onClick={moveLeft} className="w-12 h-12 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-white font-bold transition-all shadow-lg active:scale-95">←</button>
          <button onClick={moveBackward} className="w-12 h-12 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-white font-bold transition-all shadow-lg active:scale-95">↓</button>
          <button onClick={moveRight} className="w-12 h-12 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded border border-white/20 flex items-center justify-center text-white font-bold transition-all shadow-lg active:scale-95">→</button>
        </div>
      </div>
      
      {/* Help Text */}
      <div className="absolute bottom-8 right-8 z-20 text-white/50 text-xs bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
        Drag to look around • Click arrows to walk
      </div>
    </div>
  );
}
