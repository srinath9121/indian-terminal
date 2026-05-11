import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function GlobeMesh() {
  const globeRef = useRef();

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0025;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Main Globe */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#0f172a"
          emissive="#1d4ed8"
          emissiveIntensity={0.15}
          metalness={0.2}
          roughness={0.8}
          wireframe={false}
        />
      </Sphere>

      {/* Wireframe Overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial
          color="#1e3a5f"
          wireframe
          transparent
          opacity={0.25}
        />
      </Sphere>

      {/* Markers */}
      <Marker position={[1.2, 0.5, 1.4]} color="#ef4444" />
      <Marker position={[-1.1, 0.7, 1.3]} color="#22c55e" />
      <Marker position={[0.8, -0.8, 1.6]} color="#f59e0b" />
      <Marker position={[-1.5, -0.4, 1.0]} color="#3b82f6" />

      {/* Flow Lines */}
      <Arc
        start={[1.2, 0.5, 1.4]}
        end={[-1.1, 0.7, 1.3]}
        color="#22c55e"
      />

      <Arc
        start={[0.8, -0.8, 1.6]}
        end={[-1.5, -0.4, 1.0]}
        color="#ef4444"
      />
    </group>
  );
}

function Marker({ position, color }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Arc({ start, end, color }) {
  const points = useMemo(() => {
    const mid = new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.6,
      (start[2] + end[2]) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      mid,
      new THREE.Vector3(...end)
    );

    return curve.getPoints(50);
  }, [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.8}
    />
  );
}

export default function HomepageGlobe() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 320,
        background: "#060c18",
        border: "1px solid #1e2530",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "#f1f5f9",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            fontFamily: "monospace",
          }}
        >
          GLOBAL MACRO MAP
        </div>

        <div
          style={{
            color: "#22c55e",
            fontSize: 9,
            marginTop: 4,
            fontFamily: "monospace",
            letterSpacing: 0.8,
          }}
        >
          LIVE GLOBAL IMPACT FLOW
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Legend color="#ef4444" label="Oil Risk" />
        <Legend color="#22c55e" label="Liquidity Flow" />
        <Legend color="#f59e0b" label="China Weakness" />
        <Legend color="#3b82f6" label="US Rates" />
      </div>

      {/* Three Canvas */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1} />

        <GlobeMesh />

        <OrbitControls
          enableZoom={false}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />

      <span
        style={{
          color: "#94a3b8",
          fontSize: 10,
          fontFamily: "monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
