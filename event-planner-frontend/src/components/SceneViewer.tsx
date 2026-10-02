import React, { useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Box, RoundedBox, Cylinder, Plane, SoftShadows, ContactShadows, Html, Instances, Instance, Sphere, Outlines } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Photorealistic muted color palettes
const getChairColor = (c: string) => c === 'red' ? '#6b2727' : c === 'black' ? '#222222' : c === 'gold' ? '#c4b07b' : c === 'blue' ? '#2e415e' : c === 'green' ? '#3d5242' : '#e0dfd5';
const getSofaColor = (c: string) => c === 'white' ? '#f4f3ef' : c === 'black' ? '#222222' : c === 'red' ? '#6b2727' : c === 'purple' ? '#5a4663' : c === 'pink' ? '#b58e94' : c === 'green' ? '#3d5242' : '#c4b07b';
const bgColors = ['#c4b07b', '#2e415e', '#b08b5f', '#3d5242', '#8c3b3b', '#6d5a7d', '#707070', '#567585'];

// Static offsets to prevent balloons/flowers from jumping around on re-renders
const floralOffsets1 = Array.from({ length: 40 }).map(() => [(Math.random() - 0.5) * 1.5, Math.random() * 2, (Math.random() - 0.5) * 1.5] as [number, number, number]);
const floralOffsets2 = Array.from({ length: 40 }).map(() => [(Math.random() - 0.5) * 1.5, Math.random() * 2, (Math.random() - 0.5) * 1.5] as [number, number, number]);

const DistanceMarker = React.memo(({ objectPos, label, onClick, threshold = 12 }: { objectPos: [number, number, number], label: string, onClick: () => void, threshold?: number }) => {
  const [isClose, setIsClose] = useState(false);
  const vec = useMemo(() => new THREE.Vector3(...objectPos), [objectPos]);

  useFrame((state) => {
    const dist = vec.distanceTo(state.camera.position);
    if ((dist < threshold) !== isClose) {
      setIsClose(dist < threshold);
    }
  });

  if (!isClose) return null;
  return (
    <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title={`Edit ${label}`}
        className="w-8 h-8 flex items-center justify-center bg-white/40 hover:bg-white/80 text-black rounded-full text-lg shadow-sm backdrop-blur-md border border-black/10 transition-all pointer-events-auto"
      >
        +
      </button>
    </Html>
  );
});

function CameraManager({ targetPosition, allowRotation }: { targetPosition: [number, number, number], allowRotation: boolean }) {
  const vec = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    // Lock rotation facing stage unless 360 mode is enabled
    if (!allowRotation) {
      // Smoothly move position
      vec.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      state.camera.position.lerp(vec, 0.1);

      lookTarget.set(targetPosition[0], targetPosition[1], targetPosition[2] - 10);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(state.camera.position, lookTarget, state.camera.up));
      state.camera.quaternion.slerp(targetQuat, 0.1);
    }
  });
  return null;
}

const RealisticChairs = ({ capacity, globalChairColor, individualChairColors, onSelectObject }: any) => {
  const positions = useMemo(() => {
    const pos = [];
    const maxChairs = Math.min(capacity, 300);
    for (let i = 0; i < maxChairs; i++) {
      const isLeft = i % 2 === 0;
      const halfIndex = Math.floor(i / 2);
      const cols = 15;
      const row = Math.floor(halfIndex / cols);
      const col = halfIndex % cols;
      const xOffset = isLeft ? -2.5 - (col * 1.0) : 2.5 + (col * 1.0);
      const zOffset = row * 1.4;
      pos.push({ id: i, pos: [xOffset, 0, zOffset], color: individualChairColors?.[i] ? getChairColor(individualChairColors[i]) : globalChairColor });
    }
    return pos;
  }, [capacity, globalChairColor, individualChairColors]);

  return (
    <group position={[0, 0, 5]} rotation={[0, Math.PI, 0]}>
      {/* Elegant Seat Cushions (Fabric) */}
      <Instances limit={300} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[0.45, 0.06, 0.45]} />
        <meshStandardMaterial roughness={0.9} />
        <Outlines thickness={0.02} color="#555555" />
        {positions.map((p) => (
          <Instance key={`seat-${p.id}`} position={[p.pos[0], 0.45, p.pos[2]]} color={p.color} onClick={(e) => { e.stopPropagation(); onSelectObject('chair', p.id); }} />
        ))}
      </Instances>

      {/* Elegant Backrests (Fabric) */}
      <Instances limit={300} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[0.42, 0.45, 0.04]} />
        <meshStandardMaterial roughness={0.9} />
        <Outlines thickness={0.02} color="#555555" />
        {positions.map((p) => (
          <Instance key={`back-${p.id}`} position={[p.pos[0], 0.72, p.pos[2] - 0.2]} rotation={[-0.08, 0, 0]} color={p.color} onClick={(e) => { e.stopPropagation(); onSelectObject('chair', p.id); }} />
        ))}
      </Instances>

      {/* Decorative Top Handle (Metal detail) */}
      <Instances limit={300} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.015, 0.015, 0.38]} />
        <meshStandardMaterial color="#d4b06a" roughness={0.3} metalness={0.7} />
        <Outlines thickness={0.015} color="#555555" />
        {positions.map((p) => (
          <Instance key={`handle-${p.id}`} position={[p.pos[0], 0.95, p.pos[2] - 0.22]} rotation={[0, 0, Math.PI / 2]} onClick={(e) => { e.stopPropagation(); onSelectObject('chair', p.id); }} />
        ))}
      </Instances>

      {/* Dark Matte Metal Legs */}
      <Instances limit={1200} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.012, 0.01, 0.45]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
        <Outlines thickness={0.015} color="#555555" />
        {positions.flatMap((p) => [
          <Instance key={`leg1-${p.id}`} position={[p.pos[0] - 0.2, 0.225, p.pos[2] - 0.2]} />,
          <Instance key={`leg2-${p.id}`} position={[p.pos[0] + 0.2, 0.225, p.pos[2] - 0.2]} />,
          <Instance key={`leg3-${p.id}`} position={[p.pos[0] - 0.2, 0.225, p.pos[2] + 0.2]} />,
          <Instance key={`leg4-${p.id}`} position={[p.pos[0] + 0.2, 0.225, p.pos[2] + 0.2]} />
        ])}
      </Instances>
    </group>
  );
};

const HallDemoScene = ({ sceneState, category, onSelectObject, setAllowRotation }: { sceneState: any, category: string, onSelectObject: (id: string, subId?: number) => void, setAllowRotation?: any }) => {
  const globalChairColor = getChairColor(sceneState.chairColor);
  const sofaColor = getSofaColor(sceneState.sofaColor);
  const isOutdoor = category === 'Open Space';
  const isHouse = category === 'House';

  const sofaType = (parseInt(sceneState.sofaStyle) || 1) % 5;
  const floralType = (parseInt(sceneState.stageDesign) || 1) % 10;
  const djType = (parseInt(sceneState.djScreen) || 1) % 5;
  const lightType = (parseInt(sceneState.chandelierStyle) || 1) % 5;

  const stageBgColor = bgColors[(parseInt(sceneState.stageDesign) || 1) % bgColors.length];

  const doorLeftRef = React.useRef<THREE.Group>(null);
  const doorRightRef = React.useRef<THREE.Group>(null);
  const doorTargetPos = React.useMemo(() => new THREE.Vector3(0, 1.65, 25), []);

  useFrame((state) => {
    if (!doorLeftRef.current || !doorRightRef.current) return;
    const dist = state.camera.position.distanceTo(doorTargetPos);
    // Open doors if within 15 units (e.g. z from 25 to 40)
    const targetAngle = dist < 15 ? Math.PI / 1.8 : 0; 
    
    // Lerp rotation for smooth opening/closing
    doorLeftRef.current.rotation.y = THREE.MathUtils.lerp(doorLeftRef.current.rotation.y, targetAngle, 0.05);
    doorRightRef.current.rotation.y = THREE.MathUtils.lerp(doorRightRef.current.rotation.y, -targetAngle, 0.05);
  });

  const [positions, setPositions] = useState({
    stage: [0, 0, -18] as [number, number, number],
    sofa: [0, 0.8, -1] as [number, number, number],
    dj: [24, 0, -20] as [number, number, number],
  });
  const [draggingObj, setDraggingObj] = useState<string | null>(null);
  const [selectedForDrag, setSelectedForDrag] = useState<string | null>(null);

  const handleDoubleClick = (e: any, id: string) => {
    e.stopPropagation();
    if (setAllowRotation) setAllowRotation(false);
    setSelectedForDrag(id);
  };

  const startDrag = (e: any, id: string) => {
    e.stopPropagation();
    setDraggingObj(id);
    setSelectedForDrag(null);
    if (setAllowRotation) setAllowRotation(false);
  };

  const handlePointerMove = (e: any) => {
    if (draggingObj) {
      e.stopPropagation();
      setPositions(prev => ({
        ...prev,
        [draggingObj]: draggingObj === 'sofa'
          ? [e.point.x - prev.stage[0], prev.sofa[1], e.point.z - prev.stage[2]]
          : [e.point.x, prev[draggingObj as keyof typeof prev][1], e.point.z]
      }));
    }
  };

  const handleFloorClick = (e: any) => {
    if (draggingObj) {
      e.stopPropagation();
      setDraggingObj(null);
    } else {
      setSelectedForDrag(null);
    }
  };

  return (
    <group>
      {/* Interaction Plane for Dragging */}
      {draggingObj && (
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0.05, 0]} 
          onPointerMove={handlePointerMove}
          onClick={handleFloorClick}
          visible={false}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial />
        </mesh>
      )}
      {/* Photorealistic Lighting & Environment */}
      <Environment preset={isOutdoor ? "sunset" : "apartment"} background={false} blur={0.8} />
      {/* Background color simulating studio/walls if environment isn't doing it entirely */}
      {!isOutdoor && <mesh position={[0, 0, -40]}><planeGeometry args={[200, 200]} /><meshBasicMaterial color="#add8e6" /></mesh>}

      <ambientLight intensity={isOutdoor ? 0.3 : 0.3} color={isOutdoor ? "#fff4e6" : "#ffffff"} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={isOutdoor ? 1.0 : 0.5}
        color={isOutdoor ? "#ffedd5" : "#fff8f0"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      {/* Fill light from the opposite side to evenly illuminate the other walls */}
      {!isOutdoor && (
        <directionalLight
          position={[-15, 20, -10]}
          intensity={0.4}
          color="#ffffff"
        />
      )}

      {/* Grounding Contact Shadows */}
      <ContactShadows position={[0, 0.01, 0]} resolution={1024} scale={60} blur={2.5} opacity={0.6} far={2} color="#1a1a1a" />

      {/* Main Structure */}
      <group>
        {isOutdoor ? (
          <group>
            {/* Natural outdoor grass/ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#3f4a35" roughness={0.9} />
            </mesh>
            <mesh position={[0, 10, 0]}>
              <sphereGeometry args={[150, 32, 32, 0, Math.PI, 0, Math.PI / 2]} />
              <meshBasicMaterial color="#a7c3d1" side={THREE.BackSide} />
            </mesh>
          </group>
        ) : (
          <group>
            {/* Realistic Marble/Polished Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2.5]} receiveShadow>
              <planeGeometry args={[60, 55]} />
              <meshPhysicalMaterial color="#9ca3af" roughness={0.12} metalness={0.05} clearcoat={0.3} clearcoatRoughness={0.1} />
            </mesh>

            {/* Basement Foundation Block (lowered slightly to avoid z-fighting with floor) */}
            <mesh position={[0, -1.01, -2.5]} receiveShadow>
              <boxGeometry args={[62, 2, 57]} />
              <meshStandardMaterial color="#333" roughness={1.0} />
            </mesh>

            {/* General Ground outside (y=-2) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
              <planeGeometry args={[200, 200]} />
              <meshStandardMaterial color="#222" roughness={1.0} />
            </mesh>

            {/* Grand Entrance Steps */}
            {Array.from({ length: 4 }).map((_, i) => (
              <mesh key={`step-${i}`} position={[0, -0.25 - i * 0.5, 25.5 + i]} receiveShadow castShadow>
                <boxGeometry args={[24, 0.5, 1]} />
                <meshStandardMaterial color="#999" roughness={0.9} />
              </mesh>
            ))}

            {/* Welcome Table (Real Table with Skirting) */}
            <group position={[-14, -2, 28]}>
              {/* Table Top */}
              <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
                <boxGeometry args={[8, 0.1, 3]} />
                <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
              </mesh>
              {/* Table Legs */}
              {[-3.8, 3.8].map((x) => 
                [-1.3, 1.3].map((z) => (
                  <mesh key={`leg-${x}-${z}`} position={[x, 0.95, z]} castShadow>
                    <cylinderGeometry args={[0.08, 0.08, 1.9]} />
                    <meshStandardMaterial color="#3a2214" roughness={0.7} />
                  </mesh>
                ))
              )}

              {/* Saree/Fabric Tablecloth */}
              <group>
                {/* Cloth Top */}
                <mesh position={[0, 2.01, 0]} receiveShadow>
                  <boxGeometry args={[8.1, 0.02, 3.1]} />
                  <meshStandardMaterial color="#b31b1b" roughness={0.9} />
                </mesh>
                
                {/* Front Skirt (angled slightly outward, hanging down to y=0.3 to reveal legs) */}
                <mesh position={[0, 1.15, 1.6]} rotation={[-0.05, 0, 0]} receiveShadow>
                  <boxGeometry args={[8.1, 1.7, 0.05]} />
                  <meshStandardMaterial color="#b31b1b" roughness={0.9} />
                </mesh>
                {/* Back Skirt */}
                <mesh position={[0, 1.15, -1.6]} rotation={[0.05, 0, 0]} receiveShadow>
                  <boxGeometry args={[8.1, 1.7, 0.05]} />
                  <meshStandardMaterial color="#b31b1b" roughness={0.9} />
                </mesh>
                {/* Left Skirt */}
                <mesh position={[-4.1, 1.15, 0]} rotation={[0, 0, -0.05]} receiveShadow>
                  <boxGeometry args={[0.05, 1.7, 3.1]} />
                  <meshStandardMaterial color="#b31b1b" roughness={0.9} />
                </mesh>
                {/* Right Skirt */}
                <mesh position={[4.1, 1.15, 0]} rotation={[0, 0, 0.05]} receiveShadow>
                  <boxGeometry args={[0.05, 1.7, 3.1]} />
                  <meshStandardMaterial color="#b31b1b" roughness={0.9} />
                </mesh>

                {/* Golden Zari Border (Bottom of Front Skirt) */}
                <mesh position={[0, 0.4, 1.65]} rotation={[-0.05, 0, 0]}>
                  <boxGeometry args={[8.12, 0.2, 0.02]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Golden Zari Border (Top Edge of Front Skirt) */}
                <mesh position={[0, 1.9, 1.57]} rotation={[-0.05, 0, 0]}>
                  <boxGeometry args={[8.12, 0.1, 0.02]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.4} />
                </mesh>

                {/* Saree Embroidery / Motifs on Front Skirt */}
                {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
                  <mesh key={`motif-${i}`} position={[x, 1.15, 1.62]} rotation={[-0.05, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.3, 0.3, 0.02]} />
                    <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                  </mesh>
                ))}
              </group>

              {/* Fruit Bowl with Fruits */}
              <group position={[2, 2.1, 0]}>
                {/* Bowl */}
                <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.6, 0.3, 0.2, 32]} /><meshStandardMaterial color="#e6e6e6" roughness={0.2} /></mesh>
                {/* Apples (Red) */}
                <mesh position={[-0.2, 0.3, 0.1]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#ff0000" roughness={0.4} /></mesh>
                <mesh position={[0.2, 0.3, 0.2]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#ff0000" roughness={0.4} /></mesh>
                <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#ff0000" roughness={0.4} /></mesh>
                {/* Oranges (Orange) */}
                <mesh position={[0.2, 0.3, -0.2]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#ffa500" roughness={0.5} /></mesh>
                <mesh position={[-0.1, 0.3, -0.2]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#ffa500" roughness={0.5} /></mesh>
              </group>
            </group>

            {/* Red Carpet Aisle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2]} receiveShadow>
              <planeGeometry args={[3.6, 42]} />
              <meshStandardMaterial color="#8b1a1a" roughness={1.0} />
            </mesh>

            {/* Architectural Walls */}
            <group>
              <mesh position={[0, 8, -30]} receiveShadow>
                <boxGeometry args={[60, 16, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>
              <mesh position={[-20, 8, 25]} receiveShadow>
                <boxGeometry args={[20, 16, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>
              <mesh position={[20, 8, 25]} receiveShadow>
                <boxGeometry args={[20, 16, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>
              {/* Front Wall Top Filler (above doors) */}
              <mesh position={[0, 14, 25]} receiveShadow>
                <boxGeometry args={[20, 4, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>

              {/* Grand Entrance Double Doors (Traditional Wooden) */}
              <group position={[-10, 6, 25]} ref={doorLeftRef}>
                <group position={[5, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[10, 12, 0.4]} />
                    <meshStandardMaterial color="#5c3a21" roughness={0.9} />
                  </mesh>
                  {/* Outside Panels */}
                  {[-3, 0, 3].map((y, i) => (
                    <group key={`panel-l-out-${i}`} position={[0, y, 0.25]}>
                      <mesh><boxGeometry args={[7, 2.5, 0.1]} /><meshStandardMaterial color="#4a2e1b" roughness={1.0} /></mesh>
                      <mesh position={[0, 0, 0.05]}><boxGeometry args={[6, 2, 0.1]} /><meshStandardMaterial color="#3a2214" roughness={1.0} /></mesh>
                    </group>
                  ))}
                  {/* Inside Panels */}
                  {[-3, 0, 3].map((y, i) => (
                    <group key={`panel-l-in-${i}`} position={[0, y, -0.25]}>
                      <mesh><boxGeometry args={[7, 2.5, 0.1]} /><meshStandardMaterial color="#4a2e1b" roughness={1.0} /></mesh>
                      <mesh position={[0, 0, -0.05]}><boxGeometry args={[6, 2, 0.1]} /><meshStandardMaterial color="#3a2214" roughness={1.0} /></mesh>
                    </group>
                  ))}
                  <mesh position={[3.5, 0, 0.3]}><cylinderGeometry args={[0.1, 0.1, 2]} /><meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} /></mesh>
                  <mesh position={[3.5, 0, -0.3]}><cylinderGeometry args={[0.1, 0.1, 2]} /><meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} /></mesh>
                </group>
              </group>
              
              <group position={[10, 6, 25]} ref={doorRightRef}>
                <group position={[-5, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[10, 12, 0.4]} />
                    <meshStandardMaterial color="#5c3a21" roughness={0.9} />
                  </mesh>
                  {/* Outside Panels */}
                  {[-3, 0, 3].map((y, i) => (
                    <group key={`panel-r-out-${i}`} position={[0, y, 0.25]}>
                      <mesh><boxGeometry args={[7, 2.5, 0.1]} /><meshStandardMaterial color="#4a2e1b" roughness={1.0} /></mesh>
                      <mesh position={[0, 0, 0.05]}><boxGeometry args={[6, 2, 0.1]} /><meshStandardMaterial color="#3a2214" roughness={1.0} /></mesh>
                    </group>
                  ))}
                  {/* Inside Panels */}
                  {[-3, 0, 3].map((y, i) => (
                    <group key={`panel-r-in-${i}`} position={[0, y, -0.25]}>
                      <mesh><boxGeometry args={[7, 2.5, 0.1]} /><meshStandardMaterial color="#4a2e1b" roughness={1.0} /></mesh>
                      <mesh position={[0, 0, -0.05]}><boxGeometry args={[6, 2, 0.1]} /><meshStandardMaterial color="#3a2214" roughness={1.0} /></mesh>
                    </group>
                  ))}
                  <mesh position={[-3.5, 0, 0.3]}><cylinderGeometry args={[0.1, 0.1, 2]} /><meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} /></mesh>
                  <mesh position={[-3.5, 0, -0.3]}><cylinderGeometry args={[0.1, 0.1, 2]} /><meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.3} /></mesh>
                </group>
              </group>
              <mesh position={[-30, 8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[60, 16, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>
              <mesh position={[30, 8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[60, 16, 1]} />
                <meshStandardMaterial color="#add8e6" roughness={0.9} />
              </mesh>
              {/* Ceiling */}
              <mesh position={[0, 16, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <boxGeometry args={[60, 60, 1]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
              </mesh>

              {/* Wall Sconces & Lights */}
              {[-15, 0, 15].map((zPos, i) => (
                <group key={`sconce-l-${i}`} position={[-29.8, 6, zPos]}>
                  <Box args={[0.2, 1, 0.4]}><meshStandardMaterial color="#e6e6e6" metalness={0.5} roughness={0.2} /></Box>
                  <pointLight intensity={2} distance={20} color="#ffedd5" position={[1, 0, 0]} />
                </group>
              ))}
              {[-15, 0, 15].map((zPos, i) => (
                <group key={`sconce-r-${i}`} position={[29.8, 6, zPos]}>
                  <Box args={[0.2, 1, 0.4]}><meshStandardMaterial color="#e6e6e6" metalness={0.5} roughness={0.2} /></Box>
                  <pointLight intensity={2} distance={20} color="#ffedd5" position={[-1, 0, 0]} />
                </group>
              ))}
            </group>
          </group>
        )}
      </group>

      {/* Realistic Stage Area */}
      <group position={positions.stage} onDoubleClick={(e) => handleDoubleClick(e, 'stage')} onClick={(e) => { if (!draggingObj) { e.stopPropagation(); onSelectObject('stage'); } }}>
        <DistanceMarker objectPos={positions.stage} label="Stage" onClick={() => onSelectObject('stage')} threshold={8} />
        {selectedForDrag === 'stage' && (
          <Html position={[0, 8, 0]} center zIndexRange={[100, 0]}>
            <button onPointerDown={(e) => startDrag(e, 'stage')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg pointer-events-auto transition-transform active:scale-95 text-lg border-2 border-white">
              DRAG STAGE
            </button>
          </Html>
        )}

        {/* Hanging Stage Light (Chandelier) */}
        <group position={[0, 7, 0]} onClick={(e) => { e.stopPropagation(); onSelectObject('light'); }}>
          <DistanceMarker objectPos={[0, 7, -18]} label="Light" onClick={() => onSelectObject('light')} threshold={25} />

          {lightType === 0 && (
            <group>
              <Cylinder args={[0.02, 0.02, 9]} position={[0, 4.5, 0]}><meshStandardMaterial color="#222222" /></Cylinder>
              <Cylinder args={[1.5, 0.8, 1, 32, 1, true]} position={[0, -0.5, 0]}><meshStandardMaterial color="#d4b06a" side={THREE.DoubleSide} metalness={0.6} roughness={0.4} /></Cylinder>
              <Sphere args={[0.3]} position={[0, -0.7, 0]}><meshBasicMaterial color={[10, 9, 7]} /></Sphere>
              <pointLight intensity={3} distance={25} color="#ffedd5" position={[0, -1, 0]} castShadow />
            </group>
          )}

          {lightType === 1 && (
            <group>
              <Cylinder args={[0.02, 0.02, 9]} position={[0, 4.5, 0]}><meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} /></Cylinder>
              {Array.from({ length: 8 }).map((_, i) => (
                <Sphere key={`cr1-${i}`} args={[0.1]} position={[Math.cos(i * Math.PI / 4) * 1.2, 0, Math.sin(i * Math.PI / 4) * 1.2]}><meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} ior={1.5} /></Sphere>
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <Sphere key={`cr2-${i}`} args={[0.1]} position={[Math.cos(i * Math.PI / 2) * 0.6, -0.5, Math.sin(i * Math.PI / 2) * 0.6]}><meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} ior={1.5} /></Sphere>
              ))}
              <Sphere args={[0.25]} position={[0, -1, 0]}><meshBasicMaterial color={[15, 15, 15]} /></Sphere>
              <pointLight intensity={3} distance={25} color="#ffffff" position={[0, -1, 0]} castShadow />
            </group>
          )}

          {lightType === 2 && (
            <group>
              <Cylinder args={[0.02, 0.02, 9]} position={[0, 4.5, 0]}><meshStandardMaterial color="#222" /></Cylinder>
              <Cylinder args={[2, 2, 0.1, 32, 1, true]} position={[0, 0, 0]}><meshBasicMaterial color={[15, 15, 15]} side={THREE.DoubleSide} /></Cylinder>
              <Cylinder args={[1.5, 1.5, 0.1, 32, 1, true]} position={[0, -0.5, 0]}><meshBasicMaterial color={[15, 15, 15]} side={THREE.DoubleSide} /></Cylinder>
              <pointLight intensity={3} distance={25} color="#ffffff" position={[0, 0, 0]} castShadow />
            </group>
          )}

          {lightType === 3 && (
            <group>
              <Cylinder args={[0.02, 0.02, 9]} position={[0, 4.5, 0]}><meshStandardMaterial color="#222" /></Cylinder>
              <Box args={[3, 0.1, 0.1]} position={[0, 1, 0]}><meshStandardMaterial color="#111" /></Box>
              {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
                <group key={`bulb-${i}`} position={[x, 1, 0]}>
                  <Cylinder args={[0.01, 0.01, 1.5]} position={[0, -0.75, 0]}><meshStandardMaterial color="#111" /></Cylinder>
                  <Sphere args={[0.15]} position={[0, -1.5, 0]}><meshBasicMaterial color={[15, 10, 5]} /></Sphere>
                </group>
              ))}
              <pointLight intensity={3} distance={25} color="#ffcc88" position={[0, -0.5, 0]} castShadow />
            </group>
          )}

          {lightType === 4 && (
            <group>
              <Box args={[4, 0.4, 0.4]} position={[0, 0, 0]}><meshStandardMaterial color="#4a3b32" roughness={0.9} /></Box>
              <Cylinder args={[0.02, 0.02, 9]} position={[-1.5, 4.5, 0]}><meshStandardMaterial color="#222" /></Cylinder>
              <Cylinder args={[0.02, 0.02, 9]} position={[1.5, 4.5, 0]}><meshStandardMaterial color="#222" /></Cylinder>
              {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
                <group key={`cndl-${i}`} position={[x, 0.3, 0]}>
                  <Cylinder args={[0.05, 0.05, 0.2]} position={[0, 0, 0]}><meshStandardMaterial color="#e6e6e6" /></Cylinder>
                  <Cylinder args={[0.02, 0.02, 0.3]} position={[0, 0.25, 0]}><meshBasicMaterial color={[15, 8, 2]} /></Cylinder>
                </group>
              ))}
              <pointLight intensity={2} distance={25} color="#ffaa00" position={[0, 0.5, 0]} castShadow />
            </group>
          )}
        </group>

        {/* Stage Platform - Elegant Wood/Marble */}
        <Box args={[24, 0.8, 12]} position={[0, 0.4, 0]} receiveShadow castShadow>
          <meshPhysicalMaterial color="#dfdbd0" roughness={0.15} metalness={0.02} clearcoat={0.2} />
        </Box>
        {/* Stage Red Carpet Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.81, 0]} receiveShadow>
          <planeGeometry args={[22, 10]} />
          <meshStandardMaterial color="#8b1a1a" roughness={1.0} />
        </mesh>

        {/* Realistic Fabric Folds (Backdrop Curtains) */}
        <group position={[0, 4, -5.5]}>
          {Array.from({ length: 48 }).map((_, i) => (
            <Cylinder key={`curt-${i}`} args={[0.25, 0.25, 8, 16]} position={[-11.75 + i * 0.5, 0, Math.sin(i) * 0.1]} castShadow>
              <meshStandardMaterial color={stageBgColor} roughness={0.9} />
            </Cylinder>
          ))}
        </group>

        {/* Elegant Sofas (Photorealistic Proportions) */}
        <group position={positions.sofa} onDoubleClick={(e) => handleDoubleClick(e, 'sofa')} onClick={(e) => { if (!draggingObj) { e.stopPropagation(); onSelectObject('sofa'); } }}>
          <DistanceMarker objectPos={[positions.stage[0] + positions.sofa[0], positions.sofa[1], positions.stage[2] + positions.sofa[2]]} label="Sofa" onClick={() => onSelectObject('sofa')} />
          {selectedForDrag === 'sofa' && (
            <Html position={[0, 3, 0]} center zIndexRange={[100, 0]}>
              <button onPointerDown={(e) => startDrag(e, 'sofa')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg pointer-events-auto transition-transform active:scale-95 text-lg border-2 border-white">
                DRAG SOFA
              </button>
            </Html>
          )}

          {sofaType === 0 && (
            <group>
              <RoundedBox args={[3.6, 0.4, 1.2]} position={[0, 0.2, 0]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color={sofaColor} roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[3.6, 0.8, 0.3]} position={[0, 0.8, -0.45]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color={sofaColor} roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[0.4, 0.6, 1.2]} position={[-1.6, 0.3, 0]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color={sofaColor} roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[0.4, 0.6, 1.2]} position={[1.6, 0.3, 0]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color={sofaColor} roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[0.8, 0.4, 0.2]} position={[-1.2, 0.45, -0.2]} rotation={[0, 0.2, 0.1]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color="#c4b07b" roughness={0.9} />
              </RoundedBox>
              <RoundedBox args={[0.8, 0.4, 0.2]} position={[1.2, 0.45, -0.2]} rotation={[0, -0.2, -0.1]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color="#c4b07b" roughness={0.9} />
              </RoundedBox>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[-1.7, 0.1, 0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[1.7, 0.1, 0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[-1.7, 0.1, -0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[1.7, 0.1, -0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
            </group>
          )}

          {sofaType === 1 && (
            <group>
              <RoundedBox args={[4.5, 0.4, 1.5]} position={[0, 0.2, 0]} radius={0.05} smoothness={4} castShadow>
                <meshStandardMaterial color={sofaColor} roughness={0.8} />
              </RoundedBox>
              <RoundedBox args={[0.8, 0.4, 0.2]} position={[-1.5, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} radius={0.05} castShadow><meshStandardMaterial color="#c4b07b" /></RoundedBox>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[-2, 0.1, 0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[2, 0.1, 0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[-2, 0.1, -0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
              <Cylinder args={[0.04, 0.02, 0.2]} position={[2, 0.1, -0.5]} castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Cylinder>
            </group>
          )}

          {sofaType === 2 && (
            <group>
              <RoundedBox args={[3.6, 0.4, 1.2]} position={[0, 0.2, 0]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              <RoundedBox args={[1.2, 0.4, 1.6]} position={[-1.2, 0.2, 1.4]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              <RoundedBox args={[3.6, 0.8, 0.3]} position={[0, 0.8, -0.45]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
            </group>
          )}

          {sofaType === 3 && (
            <group>
              {/* Chair 1 */}
              <RoundedBox args={[1.2, 0.4, 1.2]} position={[-1.5, 0.2, 0]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              <RoundedBox args={[1.2, 0.8, 0.2]} position={[-1.5, 0.8, -0.5]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              {/* Chair 2 */}
              <RoundedBox args={[1.2, 0.4, 1.2]} position={[1.5, 0.2, 0]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              <RoundedBox args={[1.2, 0.8, 0.2]} position={[1.5, 0.8, -0.5]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              {/* Small center table */}
              <Cylinder args={[0.5, 0.5, 0.4]} position={[0, 0.2, 0]} castShadow><meshStandardMaterial color="#c4b07b" /></Cylinder>
            </group>
          )}

          {sofaType === 4 && (
            <group>
              <RoundedBox args={[5.0, 0.4, 1.4]} position={[0, 0.2, 0]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              <RoundedBox args={[5.0, 0.8, 0.3]} position={[0, 0.8, -0.55]} radius={0.05} castShadow><meshStandardMaterial color={sofaColor} roughness={0.8} /></RoundedBox>
              {/* Tufted pattern detail via small spheres */}
              {Array.from({ length: 9 }).map((_, i) => <Sphere key={i} args={[0.05]} position={[-3.2 + i * 0.8, 0.8, -0.38]}><meshStandardMaterial color="#222" /></Sphere>)}
            </group>
          )}
        </group>

        {/* Elegant Stage Floral Arrangements / Balloons */}
        {floralType === 0 && (
          <group>
            <group position={[-9, 0.8, -3]}>
              {floralOffsets1.map((pos, i) => (
                <Sphere key={`fl1-${i}`} args={[0.2, 8, 8]} position={pos} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.9} />
                </Sphere>
              ))}
            </group>
            <group position={[9, 0.8, -3]}>
              {floralOffsets2.map((pos, i) => (
                <Sphere key={`fl2-${i}`} args={[0.2, 8, 8]} position={pos} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.9} />
                </Sphere>
              ))}
            </group>
          </group>
        )}

        {floralType === 1 && (
          <group position={[0, 2, -4]}>
            {floralOffsets1.map((pos, i) => {
              const angle = (i / 40) * Math.PI;
              const x = Math.cos(angle) * 10;
              const y = Math.sin(angle) * 6;
              return (
                <Sphere key={`arch-${i}`} args={[0.3, 16, 16]} position={[x + pos[0] * 0.5, y + pos[1] * 0.5, pos[2] * 0.5]} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.6} clearcoat={0.5} />
                </Sphere>
              )
            })}
          </group>
        )}

        {floralType === 2 && (
          <group>
            <group position={[-9, 0.8, -3]}>
              {floralOffsets1.map((pos, i) => (
                <Sphere key={`pil1-${i}`} args={[0.25, 12, 12]} position={[pos[0] * 0.3, i * 0.15, pos[2] * 0.3]} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.9} />
                </Sphere>
              ))}
            </group>
            <group position={[9, 0.8, -3]}>
              {floralOffsets2.map((pos, i) => (
                <Sphere key={`pil2-${i}`} args={[0.25, 12, 12]} position={[pos[0] * 0.3, i * 0.15, pos[2] * 0.3]} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.9} />
                </Sphere>
              ))}
            </group>
          </group>
        )}

        {floralType === 3 && (
          <group position={[0, 5, -3]}>
            {floralOffsets1.map((pos, i) => (
              <group key={`hang-${i}`} position={[pos[0] * 3, 0, pos[2] * 1.5]}>
                <Cylinder args={[0.02, 0.02, 4 + pos[1]]} position={[0, 2 + pos[1] / 2, 0]}><meshStandardMaterial color="#111" /></Cylinder>
                <Sphere args={[0.4, 12, 12]} castShadow>
                  <meshStandardMaterial color={i % 3 === 0 ? "#e6d5d5" : i % 3 === 1 ? "#d4c5c5" : "#8a9a83"} roughness={0.9} />
                </Sphere>
              </group>
            ))}
          </group>
        )}

        {floralType === 4 && (
          <group position={[0, 2, -6]}>
            <Box args={[6, 4, 0.5]} position={[-8, 0, 0]} castShadow><meshStandardMaterial color={stageBgColor} /></Box>
            <Box args={[6, 4, 0.5]} position={[8, 0, 0]} castShadow><meshStandardMaterial color={stageBgColor} /></Box>
            {floralOffsets1.map((pos, i) => (
              <Sphere key={`fw1-${i}`} args={[0.3]} position={[-8 + pos[0] * 2, pos[1] * 2 - 2, 0.3]}><meshStandardMaterial color="#d4c5c5" /></Sphere>
            ))}
            {floralOffsets2.map((pos, i) => (
              <Sphere key={`fw2-${i}`} args={[0.3]} position={[8 + pos[0] * 2, pos[1] * 2 - 2, 0.3]}><meshStandardMaterial color="#8a9a83" /></Sphere>
            ))}
          </group>
        )}

        {/* New Indian Wedding Stage Designs */}
        {floralType === 5 && (
          <group position={[0, 0, -5]}>
            {/* Traditional Mandap Setup */}
            <Box args={[16, 0.5, 6]} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#c4b07b" /></Box>
            {[-6, 6].map(x => (
              <group key={`mandap-side-${x}`} position={[x, 0, 0]}>
                {[-2, 2].map(z => (
                  <group key={`pillar-${z}`} position={[0, 0, z]}>
                    <Cylinder args={[0.4, 0.4, 6]} position={[0, 3, 0]} castShadow><meshStandardMaterial color="#d4b06a" roughness={0.3} metalness={0.6} /></Cylinder>
                    <Torus args={[0.6, 0.2, 16, 32]} position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#a83232" /></Torus>
                    <Torus args={[0.6, 0.2, 16, 32]} position={[0, 5.8, 0]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#a83232" /></Torus>
                  </group>
                ))}
                <Box args={[2, 0.6, 6]} position={[0, 6.3, 0]} castShadow><meshStandardMaterial color="#ffffff" /></Box>
              </group>
            ))}
            <Box args={[12, 1, 6]} position={[0, 6.5, 0]} castShadow><meshStandardMaterial color="#d4b06a" /></Box>
            {/* Hanging garlands */}
            {Array.from({ length: 12 }).map((_, i) => (
              <group key={`garland-${i}`} position={[-5.5 + i, 6, 2]}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Sphere key={j} args={[0.15]} position={[0, -j * 0.4, 0]}><meshStandardMaterial color={j % 2 === 0 ? "#ffffff" : "#a83232"} /></Sphere>
                ))}
              </group>
            ))}
            <Plane args={[16, 8]} position={[0, 4, -2.9]}><meshStandardMaterial color="#fdfbf7" /></Plane>
          </group>
        )}

        {floralType === 6 && (
          <group position={[0, 4, -5.5]}>
            {/* Red & Orange Drapes */}
            <Plane args={[24, 8]} position={[0, 0, 0]}><meshStandardMaterial color="#ff9900" roughness={0.9} /></Plane>
            <Plane args={[12, 8]} position={[-6, 0, 0.1]} rotation={[0, 0, -0.2]}><meshStandardMaterial color="#cc0000" roughness={0.9} /></Plane>
            <Plane args={[12, 8]} position={[6, 0, 0.1]} rotation={[0, 0, 0.2]}><meshStandardMaterial color="#cc0000" roughness={0.9} /></Plane>
            {/* Giant Golden Pillars */}
            <Cylinder args={[0.8, 0.8, 8]} position={[-8, 0, 1]} castShadow><meshStandardMaterial color="#d4b06a" metalness={0.7} roughness={0.2} /></Cylinder>
            <Cylinder args={[0.8, 0.8, 8]} position={[8, 0, 1]} castShadow><meshStandardMaterial color="#d4b06a" metalness={0.7} roughness={0.2} /></Cylinder>
          </group>
        )}

        {floralType === 7 && (
          <group position={[0, 0, -5]}>
            {/* Golden Carved Arches & Purple Uplighting */}
            <Box args={[20, 8, 0.5]} position={[0, 4, 0]} castShadow><meshStandardMaterial color="#d4b06a" metalness={0.8} roughness={0.2} /></Box>
            <Cylinder args={[3, 3, 0.6, 32, 1, false, 0, Math.PI]} position={[0, 5, 0.1]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
            <Box args={[6, 5, 0.6]} position={[0, 2.5, 0.1]}><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[2, 2, 0.6, 32, 1, false, 0, Math.PI]} position={[-6, 4, 0.1]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
            <Box args={[4, 4, 0.6]} position={[-6, 2, 0.1]}><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[2, 2, 0.6, 32, 1, false, 0, Math.PI]} position={[6, 4, 0.1]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#1a1a1a" /></Cylinder>
            <Box args={[4, 4, 0.6]} position={[6, 2, 0.1]}><meshStandardMaterial color="#1a1a1a" /></Box>
            {/* Intense Magenta Uplighting */}
            <pointLight position={[0, 1, 1]} intensity={5} distance={15} color="#ff00ff" />
            <pointLight position={[-6, 1, 1]} intensity={3} distance={15} color="#ff00ff" />
            <pointLight position={[6, 1, 1]} intensity={3} distance={15} color="#ff00ff" />
          </group>
        )}

        {floralType === 8 && (
          <group position={[0, 0, -5]}>
            {/* Red Floral Wall */}
            <Box args={[24, 10, 0.5]} position={[0, 5, 0]} castShadow><meshStandardMaterial color="#8b0000" roughness={1.0} /></Box>
            {/* Hanging White Flower Strings */}
            {Array.from({ length: 20 }).map((_, i) => (
              <group key={`string-${i}`} position={[-9.5 + i, 9, 0.5]}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <Sphere key={j} args={[0.15]} position={[0, -j * 0.8, 0]}><meshStandardMaterial color="#ffffff" /></Sphere>
                ))}
              </group>
            ))}
            {/* Mini Chandeliers */}
            <group position={[-5, 7, 2]}>
              <Cylinder args={[0.8, 0.4, 0.8]}><meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} /></Cylinder>
              <pointLight intensity={3} distance={10} color="#ffedd5" />
            </group>
            <group position={[5, 7, 2]}>
              <Cylinder args={[0.8, 0.4, 0.8]}><meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} /></Cylinder>
              <pointLight intensity={3} distance={10} color="#ffedd5" />
            </group>
          </group>
        )}

        {floralType === 9 && (
          <group position={[0, 0, -5]}>
            {/* Peach Backdrop */}
            <Plane args={[24, 10]} position={[0, 5, 0]}><meshStandardMaterial color="#ffdab9" roughness={0.9} /></Plane>
            {/* Top Floral Border */}
            <Box args={[24, 1, 1]} position={[0, 9.5, 0.5]}><meshStandardMaterial color="#8a9a83" /></Box>
            <Box args={[24, 0.5, 1.2]} position={[0, 9.5, 0.5]}><meshStandardMaterial color="#a83232" /></Box>
            {/* Hanging fairy lights */}
            {Array.from({ length: 15 }).map((_, i) => (
              <group key={`fairy-${i}`} position={[-7 + i, 9, 0.5]}>
                <Cylinder args={[0.01, 0.01, 3]} position={[0, -1.5, 0]}><meshStandardMaterial color="#555" /></Cylinder>
                <Sphere args={[0.1]} position={[0, -3, 0]}><meshBasicMaterial color={[5, 4, 3]} /></Sphere>
              </group>
            ))}
            {/* Floral Arch Over Sofa */}
            <Torus args={[4, 0.3, 16, 64, Math.PI]} position={[0, 1, 1]} rotation={[0, 0, 0]}><meshStandardMaterial color="#8a9a83" /></Torus>
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 19) * Math.PI;
              return <Sphere key={`archf-${i}`} args={[0.4]} position={[Math.cos(angle) * 4, 1 + Math.sin(angle) * 4, 1.2]}><meshStandardMaterial color={i % 2 === 0 ? "#a83232" : "#ffdab9"} /></Sphere>
            })}
          </group>
        )}

        {/* Subtle Stage Uplighting */}
        <pointLight position={[-6, 1, -4]} intensity={0.5} color="#ffe6cc" distance={10} decay={2} />
        <pointLight position={[6, 1, -4]} intensity={0.5} color="#ffe6cc" distance={10} decay={2} />
      </group>

      <RealisticChairs capacity={sceneState.capacity} globalChairColor={globalChairColor} individualChairColors={sceneState.individualChairColors} onSelectObject={onSelectObject} />

      {/* Photorealistic DJ Setup (Wood, Matte Metals, No Neon) */}
      {sceneState.hasDJ && (
        <group position={positions.dj} onDoubleClick={(e) => handleDoubleClick(e, 'dj')} onClick={(e) => { if (!draggingObj) { e.stopPropagation(); onSelectObject('dj'); } }}>
          <DistanceMarker objectPos={positions.dj} label="DJ" onClick={() => onSelectObject('dj')} threshold={6} />
          {selectedForDrag === 'dj' && (
            <Html position={[0, 6, 0]} center zIndexRange={[100, 0]}>
              <button onPointerDown={(e) => startDrag(e, 'dj')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg pointer-events-auto transition-transform active:scale-95 text-lg border-2 border-white">
                DRAG DJ
              </button>
            </Html>
          )}

          {/* TRUSS SYSTEM */}
          <group position={[0, 0, -0.5]}>
            {/* Pillars */}
            <Box args={[0.3, 4.5, 0.3]} position={[-4, 2.25, 0]} castShadow><meshStandardMaterial color="#222" roughness={0.7} /></Box>
            <Box args={[0.3, 4.5, 0.3]} position={[4, 2.25, 0]} castShadow><meshStandardMaterial color="#222" roughness={0.7} /></Box>
            
            {/* Top Crossbar - Main Beams */}
            <Box args={[8.3, 0.1, 0.3]} position={[0, 4.5, 0]} castShadow><meshStandardMaterial color="#222" roughness={0.7} /></Box>
            <Box args={[8.3, 0.1, 0.3]} position={[0, 3.8, 0]} castShadow><meshStandardMaterial color="#222" roughness={0.7} /></Box>
            
            {/* Truss Zig Zags */}
            {Array.from({ length: 8 }).map((_, i) => (
              <group key={`zig-${i}`} position={[-3.5 + i, 4.15, 0]}>
                <Box args={[0.05, 0.85, 0.1]} rotation={[0, 0, 0.6]} castShadow><meshStandardMaterial color="#222" /></Box>
                <Box args={[0.05, 0.85, 0.1]} rotation={[0, 0, -0.6]} castShadow><meshStandardMaterial color="#222" /></Box>
                <Box args={[0.05, 0.7, 0.1]} rotation={[0, 0, 0]} castShadow><meshStandardMaterial color="#222" /></Box>
              </group>
            ))}

            {/* Top Par Lights (Left) */}
            <group position={[-4, 4.7, 0.2]}>
              <Box args={[1.6, 0.1, 0.1]} position={[0, 0, 0]}><meshStandardMaterial color="#111" /></Box>
              {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
                <group key={`par-l-${i}`} position={[x, 0.2, 0]}>
                  <Box args={[0.2, 0.3, 0.2]} castShadow><meshStandardMaterial color="#111" /></Box>
                  <Cylinder args={[0.08, 0.08, 0.25]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
                    <meshBasicMaterial color={['#ff0000', '#00ff00', '#0000ff', '#ffff00'][i]} />
                  </Cylinder>
                </group>
              ))}
            </group>

            {/* Top Par Lights (Right) */}
            <group position={[4, 4.7, 0.2]}>
              <Box args={[1.6, 0.1, 0.1]} position={[0, 0, 0]}><meshStandardMaterial color="#111" /></Box>
              {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
                <group key={`par-r-${i}`} position={[x, 0.2, 0]}>
                  <Box args={[0.2, 0.3, 0.2]} castShadow><meshStandardMaterial color="#111" /></Box>
                  <Cylinder args={[0.08, 0.08, 0.25]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
                    <meshBasicMaterial color={['#ff0000', '#00ff00', '#0000ff', '#ffff00'][i]} />
                  </Cylinder>
                </group>
              ))}
            </group>

            {/* Hanging Moving Heads */}
            {[-2.5, -1.25, 0, 1.25, 2.5].map((x, i) => (
              <group key={`head-${i}`} position={[x, 3.6, 0.1]}>
                <Box args={[0.2, 0.3, 0.2]} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
                <Box args={[0.3, 0.1, 0.3]} position={[0, -0.2, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
                <Cylinder args={[0.15, 0.15, 0.25]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.4, 0.1]}>
                  <meshBasicMaterial color={['#ff0000', '#00ff00', '#0000ff', '#ff0000', '#ffff00'][i]} />
                </Cylinder>
              </group>
            ))}
            
            {/* Floor Lights */}
            {[-4, -2.4, -0.8, 0.8, 2.4, 4].map((x, i) => (
              <group key={`floor-light-${i}`} position={[x, 0.2, 1.5]}>
                <Cylinder args={[0.2, 0.2, 0.4]} rotation={[Math.PI / 8, 0, 0]} castShadow>
                  <meshStandardMaterial color="#111" />
                </Cylinder>
                <Cylinder args={[0.18, 0.18, 0.41]} rotation={[Math.PI / 8, 0, 0]}>
                  <meshBasicMaterial color={['#ff0000', '#ff00ff', '#0000ff', '#00ffff', '#00ff00', '#ffff00'][i]} />
                </Cylinder>
              </group>
            ))}
          </group>

          {/* DANCE FLOOR */}
          <group position={[0, 0.05, 5]}>
            {/* Highly reflective glossy dance floor */}
            <Box args={[14, 0.05, 8]} receiveShadow>
              <meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.1} clearcoat={1.0} clearcoatRoughness={0.1} />
            </Box>
            {/* Dance floor neon border */}
            <Box args={[14.2, 0.02, 8.2]} position={[0, -0.01, 0]}>
              <meshBasicMaterial color="#00ffff" />
            </Box>
          </group>

          {/* LEFT SPEAKER STACK */}
          <group position={[-2.8, 0, 0.5]}>
            <Box args={[1, 1.2, 1]} position={[-0.6, 0.6, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
            <Cylinder args={[0.3, 0.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 0.6, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[1, 1.2, 1]} position={[0.6, 0.6, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
            <Cylinder args={[0.3, 0.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 0.6, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[0.8, 1, 0.8]} position={[-0.6, 1.7, 0]} castShadow><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[0.2, 0.2, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 1.8, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            <Cylinder args={[0.15, 0.15, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 1.4, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[0.8, 1, 0.8]} position={[0.6, 1.7, 0]} castShadow><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[0.2, 0.2, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 1.8, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            <Cylinder args={[0.15, 0.15, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 1.4, 0]}><meshStandardMaterial color="#000" /></Cylinder>
          </group>

          {/* RIGHT SPEAKER STACK */}
          <group position={[2.8, 0, 0.5]}>
            <Box args={[1, 1.2, 1]} position={[-0.6, 0.6, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
            <Cylinder args={[0.3, 0.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 0.6, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[1, 1.2, 1]} position={[0.6, 0.6, 0]} castShadow><meshStandardMaterial color="#111" /></Box>
            <Cylinder args={[0.3, 0.3, 1.01]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 0.6, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[0.8, 1, 0.8]} position={[-0.6, 1.7, 0]} castShadow><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[0.2, 0.2, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 1.8, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            <Cylinder args={[0.15, 0.15, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[-0.6, 1.4, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            
            <Box args={[0.8, 1, 0.8]} position={[0.6, 1.7, 0]} castShadow><meshStandardMaterial color="#1a1a1a" /></Box>
            <Cylinder args={[0.2, 0.2, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 1.8, 0]}><meshStandardMaterial color="#000" /></Cylinder>
            <Cylinder args={[0.15, 0.15, 0.81]} rotation={[Math.PI / 2, 0, 0]} position={[0.6, 1.4, 0]}><meshStandardMaterial color="#000" /></Cylinder>
          </group>

          {/* DJ BOOTH */}
          <group position={[0, 0, 1]}>
            {/* Main Table Body */}
            <Box args={[3.2, 1.1, 1]} position={[0, 0.55, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#111" roughness={0.8} />
            </Box>
            
            {/* Front Screen with Red Outline */}
            <Box args={[3.0, 0.9, 0.1]} position={[0, 0.55, 0.51]} castShadow>
              <meshBasicMaterial color="#ff0000" />
            </Box>
            <Box args={[2.8, 0.7, 0.11]} position={[0, 0.55, 0.51]} castShadow>
              <meshBasicMaterial color="#0a0a0a" />
            </Box>

            {/* Blue Mixer/CDJ Setup on Top */}
            <Box args={[1.2, 0.1, 0.5]} position={[0, 1.15, -0.1]} castShadow>
              <meshStandardMaterial color="#0000cc" roughness={0.4} />
            </Box>
            {/* Decks */}
            <Box args={[0.4, 0.05, 0.4]} position={[-0.8, 1.125, -0.1]} castShadow><meshStandardMaterial color="#222" /></Box>
            <Box args={[0.4, 0.05, 0.4]} position={[0.8, 1.125, -0.1]} castShadow><meshStandardMaterial color="#222" /></Box>
          </group>
        </group>
      )}
    </group>
  );
};

export default function SceneViewer({ sceneState, category = '', onSelectObject }: { sceneState: any, category?: string, onSelectObject?: (id: string, subId?: number) => void }) {
  if (sceneState.mode === '2d') {
    return (
      <div className="w-full h-full bg-[#add8e6] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />
        <div className="relative w-[800px] h-[600px] border border-gray-300 bg-white rounded shadow-sm overflow-hidden p-8">
          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center mb-8 border border-gray-200 text-gray-500 font-medium">
            Stage Area
          </div>
          <div className="flex justify-between px-12">
            <div className={`w-48 h-64 rounded border border-dashed flex items-center justify-center text-gray-500`} style={{ borderColor: '#d1d5db' }}>
              {Math.floor(sceneState.capacity / 2)} Chairs
            </div>
            {sceneState.hasDJ && (
              <div className="w-32 h-24 bg-gray-50 border border-gray-300 rounded flex items-center justify-center absolute right-8 top-8 text-gray-500 text-sm">
                DJ Area
              </div>
            )}
            <div className={`w-48 h-64 rounded border border-dashed flex items-center justify-center text-gray-500`} style={{ borderColor: '#d1d5db' }}>
              {Math.floor(sceneState.capacity / 2)} Chairs
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Realistic human eye-level camera height
  const EYE_LEVEL = 1.65;
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, EYE_LEVEL - 2, 35]);
  const [allowRotation, setAllowRotation] = useState(false);

  const calculateHeight = (x: number, z: number) => {
    // Drop camera height to ground level outside the hall
    if (z > 29) return EYE_LEVEL - 2;
    // Gradually elevate camera when walking on the stairs (z from 29 to 25)
    if (z > 25 && z <= 29) return EYE_LEVEL - (0.5 * (z - 25));
    // Stage bounds: x from -12 to 12, z from -12 to -24
    if (x >= -12 && x <= 12 && z <= -12 && z >= -24) {
      return EYE_LEVEL + 0.8; // Elevate view when on stage platform
    }
    return EYE_LEVEL;
  };

  const moveForward = () => { setAllowRotation(false); setCameraPos(prev => [prev[0], calculateHeight(prev[0], prev[2] - 2), prev[2] - 2]); };
  const moveBackward = () => { setAllowRotation(false); setCameraPos(prev => [prev[0], calculateHeight(prev[0], prev[2] + 2), prev[2] + 2]); };
  const moveLeft = () => { setAllowRotation(false); setCameraPos(prev => [prev[0] - 2, calculateHeight(prev[0] - 2, prev[2]), prev[2]]); };
  const moveRight = () => { setAllowRotation(false); setCameraPos(prev => [prev[0] + 2, calculateHeight(prev[0] + 2, prev[2]), prev[2]]); };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') moveForward();
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') moveBackward();
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moveLeft();
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moveRight();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full bg-[#add8e6] relative" onDoubleClick={() => setAllowRotation(prev => !prev)}>
      <Canvas
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        camera={{ position: [0, EYE_LEVEL - 2, 35], fov: 45 }} // Photographic FOV
      >
        <color attach="background" args={['#add8e6']} />

        <SoftShadows size={15} samples={16} focus={0.5} />
        <CameraManager targetPosition={cameraPos} allowRotation={allowRotation} />

        {/* OrbitControls enabled only on double-click */}
        {allowRotation && <OrbitControls makeDefault target={[cameraPos[0], cameraPos[1], cameraPos[2] - 0.1]} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />}

        <HallDemoScene sceneState={sceneState} category={category} onSelectObject={onSelectObject || (() => { })} setAllowRotation={setAllowRotation} />
      </Canvas>

      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-1 z-20">
        <button onClick={moveForward} className="w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded border border-gray-300 flex items-center justify-center text-gray-700 font-bold transition-all shadow-sm active:scale-95">↑</button>
        <div className="flex gap-1">
          <button onClick={moveLeft} className="w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded border border-gray-300 flex items-center justify-center text-gray-700 font-bold transition-all shadow-sm active:scale-95">←</button>
          <button onClick={moveBackward} className="w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded border border-gray-300 flex items-center justify-center text-gray-700 font-bold transition-all shadow-sm active:scale-95">↓</button>
          <button onClick={moveRight} className="w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded border border-gray-300 flex items-center justify-center text-gray-700 font-bold transition-all shadow-sm active:scale-95">→</button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end gap-2">
        {allowRotation ? (
          <div className="bg-yellow-100 text-yellow-800 font-bold px-4 py-2 rounded-full shadow-md animate-pulse border border-yellow-300">
            360° View Unlocked (Move to relock)
          </div>
        ) : null}
        <div className="text-gray-600 text-xs bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200 font-medium">
          Use Arrow Keys / WASD to move • Double tap to unlock 360°
        </div>
      </div>
    </div>
  );
}
