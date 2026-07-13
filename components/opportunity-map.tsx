"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const cities = [
  { name: "Dhaka", score: 86, position: [0.35, 0.9, 0.42] },
  { name: "Chattogram", score: 79, position: [1.2, -1.25, 0.42] },
  { name: "Sylhet", score: 73, position: [1.15, 2.15, 0.42] },
  { name: "Rajshahi", score: 68, position: [-1.45, 1.1, 0.42] },
  { name: "Khulna", score: 64, position: [-0.8, -1.45, 0.42] },
] as const;

function BangladeshScene({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const shape = useMemo(() => {
    // A deliberately stylized silhouette keeps the scene lightweight and illustrative.
    const path = new THREE.Shape();
    const points = [[-1.2,2.8],[-.35,2.65],[.25,2.9],[.75,2.3],[1.45,2.15],[1.65,1.55],[1.2,.95],[1.45,.25],[1.1,-.35],[1.35,-1.2],[.8,-1.75],[.75,-2.6],[.1,-2.15],[-.35,-2.75],[-.75,-2],[-1.25,-1.65],[-1.05,-.8],[-1.55,-.15],[-1.3,.65],[-1.8,1.15],[-1.25,1.8]];
    path.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x,y]) => path.lineTo(x,y));
    path.closePath();
    return path;
  }, []);

  useFrame((state, delta) => {
    if (!active || !group.current) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * .35) * .025;
    group.current.rotation.y += delta * .055;
    group.current.rotation.x = -.36 + state.pointer.y * .035;
    group.current.rotation.y += state.pointer.x * delta * .05;
  });

  return (
    <group ref={group} rotation={[-.36, -.12, -.12]}>
      <mesh>
        <extrudeGeometry args={[shape, { depth: .34, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3 }]} />
        <meshStandardMaterial color="#0891b2" roughness={.42} metalness={.24} />
      </mesh>
      {cities.map((city, index) => (
        <group key={city.name} position={city.position}>
          <mesh position={[0,0,.18]}>
            <sphereGeometry args={[.11, 20, 20]} />
            <meshStandardMaterial color={index === 0 ? "#53e0ff" : "#53e0ff"} emissive={index === 0 ? "#53e0ff" : "#53e0ff"} emissiveIntensity={.9} />
          </mesh>
          <mesh position={[0,0,.08]}><ringGeometry args={[.18,.22,24]} /><meshBasicMaterial color="#ffffff" transparent opacity={.7} side={THREE.DoubleSide} /></mesh>
          <Html position={[0,0,.68]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-full border border-[#53e0ff]/20 bg-[#08101f]/95 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur">
              {city.name} <span className="ml-1 text-[#55e4b3]">{city.score}%</span>
            </div>
          </Html>
        </group>
      ))}
      <RoundedBox args={[1.25,.42,.22]} radius={.08} smoothness={4} position={[-1.55,-2.75,.5]}><meshStandardMaterial color="#0f1730" /></RoundedBox>
    </group>
  );
}

export function OpportunityMap({ active }: { active: boolean }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_50%_45%,#162044_0,#0b1125_48%,#070b16_78%)]" aria-label="Interactive stylized Bangladesh opportunity map">
      <Canvas camera={{ position: [0,0,8.2], fov: 42 }} dpr={[1,1.5]} frameloop={active ? "always" : "demand"}>
        <ambientLight intensity={1.45} />
        <directionalLight position={[4,6,8]} intensity={2.5} color="#dffaff" />
        <pointLight position={[-4,-2,4]} intensity={18} color="#0891b2" />
        <BangladeshScene active={active} />
        <ContactShadows position={[0,-3.15,0]} opacity={.18} scale={8} blur={2.5} far={6} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-5 left-5 rounded-xl border border-white/10 bg-[#08101f]/90 px-3 py-2 text-xs font-semibold text-[#9aa5bd] backdrop-blur">Move your cursor to explore • Illustrative data</div>
    </div>
  );
}
