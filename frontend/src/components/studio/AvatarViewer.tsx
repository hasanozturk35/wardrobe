import React, { useRef, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, Image as Image3D } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useStudioStore } from '../../store/studioStore';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause } from 'lucide-react';

const ClothingOverlay = () => {
    const { wornItems } = useStudioStore();

    // MVP: Display top, bottom, shoes as 2D planes hovering in front of the avatar cylinder
    return (
        <group position={[0, -0.2, 0.4]}>
            {wornItems.top && (
                <Image3D
                    url={wornItems.top.photos?.[0]?.url || 'https://placehold.co/400x400'}
                    position={[0, 1.2, 0]}
                    scale={[0.8, 0.8]}
                    transparent
                    opacity={0.95}
                />
            )}
            {wornItems.bottom && (
                <Image3D
                    url={wornItems.bottom.photos?.[0]?.url || 'https://placehold.co/400x400'}
                    position={[0, 0.4, 0]}
                    scale={[0.7, 0.8]}
                    transparent
                    opacity={0.95}
                />
            )}
            {wornItems.shoes && (
                <Image3D
                    url={wornItems.shoes.photos?.[0]?.url || 'https://placehold.co/400x400'}
                    position={[0, -0.6, 0.1]}
                    scale={[0.5, 0.4]}
                    transparent
                    opacity={0.95}
                />
            )}
        </group>
    );
};

const AvatarScene = ({ autoRotate }: { autoRotate: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null!);

    // Simple idle animation for the placeholder
    useFrame((state) => {
        if (meshRef.current && !autoRotate) {
            // Subtle breathing effect if not auto-rotating
            meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.02 - 0.5;
        } else if (meshRef.current && autoRotate) {
            meshRef.current.position.y = -0.5;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            <Suspense fallback={
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 1.8, 32]} />
                    <meshStandardMaterial color="#eeeeee" />
                </mesh>
            }>
                {/* MVP Placeholder Avatar */}
                <group position={[0, -0.2, 0]}>
                    <mesh ref={meshRef}>
                        <cylinderGeometry args={[0.3, 0.3, 1.7, 40]} />
                        <meshStandardMaterial
                            color="#e0e0e0"
                            roughness={0.4}
                            metalness={0.1}
                        />
                    </mesh>
                    <mesh position={[0, 1.0, 0]}>
                        <sphereGeometry args={[0.22, 32, 32]} />
                        <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
                    </mesh>
                </group>

                {/* Layered Clothing */}
                <ClothingOverlay />
            </Suspense>

            <ContactShadows
                position={[0, -1.2, 0]}
                opacity={0.4}
                scale={10}
                blur={2}
                far={10}
                resolution={256}
                color="#000000"
            />
            <Environment preset="studio" />
        </>
    );
};

const AvatarViewer: React.FC = () => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [autoRotate, setAutoRotate] = useState(false);

    const handleZoom = (direction: 'in' | 'out') => {
        if (controlsRef.current) {
            controlsRef.current.minDistance = 2.0;
            controlsRef.current.maxDistance = 8.0;

            // Simple approach: set target and let orbit controls handle it or simply dolly
            if (direction === 'in') {
                controlsRef.current.dollyIn(1.2);
            } else {
                controlsRef.current.dollyOut(1.2);
            }
            controlsRef.current.update();
        }
    };

    const handleReset = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            setAutoRotate(false);
            controlsRef.current.update();
        }
    };

    return (
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing focus:outline-none">
            {/* 3D Canvas */}
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={40} />
                <AvatarScene autoRotate={autoRotate} />
                <OrbitControls
                    ref={controlsRef}
                    enablePan={false}
                    minDistance={2.0}
                    maxDistance={8}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.6}
                    target={[0, 0.5, 0]}
                    autoRotate={autoRotate}
                    autoRotateSpeed={2.0}
                />
            </Canvas>

            {/* Studio Controls UI */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col space-y-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-xl z-10">
                <button
                    onClick={() => handleZoom('in')}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700"
                    title="Yaklaştır"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleZoom('out')}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700"
                    title="Uzaklaştır"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <div className="w-full h-px bg-gray-200 my-1 font-bold"></div>
                <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all ${autoRotate ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                    title="Otomatik Döndür"
                >
                    {autoRotate ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                    onClick={handleReset}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-700"
                    title="Görünümü Sıfırla"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default AvatarViewer;
