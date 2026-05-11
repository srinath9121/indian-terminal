import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Sphere() {
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial color="#0f5ea8" wireframe />
    </mesh>
  );
}

export default function Globe() {
  return (
    <div className="h-[520px] w-full">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.1} />
        <pointLight position={[10, 10, 10]} />
        <Sphere />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
