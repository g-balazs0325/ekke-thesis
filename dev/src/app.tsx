import { Canvas } from "@react-three/fiber";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
const MyApp = () => {
  return (
    <>
      <h1>Hello World!</h1>
      <Canvas>
        <directionalLight position={[0, 1, 0]} />
        <mesh>
          <torusKnotGeometry />
          <meshPhysicalMaterial />
        </mesh>
      </Canvas>
    </>
  );
};

root.render(<MyApp />);
