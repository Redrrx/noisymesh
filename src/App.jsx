import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import './App.css';

const generateSphericalNoise = (radius, segments, noiseScale) => {
    const noise3D = createNoise3D();
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const positionAttribute = geometry.getAttribute('position');
    const vx = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
        vx.fromBufferAttribute(positionAttribute, i);
        const noise = noise3D(vx.x * noiseScale, vx.y * noiseScale, vx.z * noiseScale);
        vx.normalize().multiplyScalar(radius * (1 + noise * 0.2));
        positionAttribute.setXYZ(i, vx.x, vx.y, vx.z);
    }

    geometry.computeVertexNormals();
    return geometry;
};

const NoisySphere = ({ rotationSpeed, wireframe, geometry }) => {
    const meshRef = useRef();

    const gradientTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#FFA500');  // Orange
        gradient.addColorStop(1, '#800080');  // Purple
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.y = time * rotationSpeed;
    });

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshPhongMaterial
                map={gradientTexture}
                emissive={new THREE.Color(0x330033)}
                emissiveIntensity={1}
                shininess={50}
                wireframe={wireframe}
            />
        </mesh>
    );
};

const App = () => {
    const [rotationSpeed, setRotationSpeed] = useState(0.1);
    const [wireframe, setWireframe] = useState(false);
    const [geometry, setGeometry] = useState(() => generateSphericalNoise(1, 64, 0.5));

    const regenerateMesh = useCallback(() => {
        setGeometry(generateSphericalNoise(1, 128, 0.5));
    }, []);

    return (
        <div className="container">
            <div className="canvas-container">
                <Canvas camera={{ position: [0, 0, 2], fov: 90 }}>
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 10, 10]} />
                    <NoisySphere rotationSpeed={rotationSpeed} wireframe={wireframe} geometry={geometry} />
                    <OrbitControls />
                </Canvas>
            </div>
            <div className="text-container">
                <h1>This is procedurally generated</h1>
                <label>
                    Rotation Speed:
                    <input
                        type="number"
                        value={rotationSpeed}
                        onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                        step="0.01"
                    />
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={wireframe}
                        onChange={() => setWireframe(!wireframe)}
                    />
                    Wireframe, that is a lot of vertices?
                </label>
                <br />
                <button onClick={regenerateMesh}>Regenerate Mesh</button>
            </div>
        </div>
    );
};

export default App;
