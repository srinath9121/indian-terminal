import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Rotating wireframe globe with pulsing dots for key regions.
 * Matches monolith visual: dark sphere, blue-tinted wireframe, glow dots.
 */

const HOTSPOTS = [
  { lat: 25, lon: 55, color: "#ef4444" },   // Middle East
  { lat: 35, lon: 105, color: "#f59e0b" },  // China
  { lat: 40, lon: -100, color: "#3b82f6" }, // US
  { lat: 50, lon: 10, color: "#f59e0b" },   // Europe
  { lat: 20, lon: 78, color: "#22c55e" },   // India
];

function latLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function GlobeWireframe() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref}>
      {/* Wireframe sphere */}
      <Sphere args={[1.6, 32, 32]}>
        <meshBasicMaterial color="#1e3a5f" wireframe transparent opacity={0.3} />
      </Sphere>

      {/* Solid inner sphere for depth */}
      <Sphere args={[1.58, 32, 32]}>
        <meshBasicMaterial color="#0d1829" transparent opacity={0.9} />
      </Sphere>

      {/* Hotspot dots */}
      {HOTSPOTS.map((h, i) => {
        const [x, y, z] = latLonToXYZ(h.lat, h.lon, 1.65);
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={h.color} />
          </mesh>
        );
      })}
    </group>
  );
}

function GlobeFallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 35% 35%, #1a2744 0%, #0d1829 40%, #060c18 100%)",
        border: "1px solid #1e3a5f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 40px #1d4ed822",
        minHeight: 180,
      }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            border: "1px solid #1e3a5f44",
            borderRadius: "50%",
            width: `${30 + i * 14}%`,
            height: `${30 + i * 14}%`,
          }}
        />
      ))}
      {[
        { top: "20%", left: "55%", color: "#ef4444" },
        { top: "40%", left: "30%", color: "#3b82f6" },
        { top: "60%", left: "60%", color: "#22c55e" },
        { top: "30%", left: "70%", color: "#f59e0b" },
      ].map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: d.top,
            left: d.left,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: d.color,
            boxShadow: `0 0 8px ${d.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function Globe() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 200 }}>
      <Suspense fallback={<GlobeFallback />}>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.3} />
          <GlobeWireframe />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
