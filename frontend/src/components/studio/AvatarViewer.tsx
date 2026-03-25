import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, Environment, ContactShadows } from '@react-three/drei';
import { useRef, useState, useEffect, Suspense, useImperativeHandle, forwardRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RotateCcw, User, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import { getImageUrl } from '../../config';
import { useStudioStore } from '../../store/studioStore';

// 1. Loading UI using Html component from drei
function Loader() {
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                <p className="font-bold text-gray-800 whitespace-nowrap">Avatar Yükleniyor...</p>
                <p className="text-xs text-gray-500 mt-1">3D Model hazırlanıyor</p>
            </div>
        </Html>
    );
}

// AvatarModel and PlaceholderAvatar removed as requested

// 4. Component to render 3D Garment Mesh (Standalone or Skeletal Sync)
function GarmentMesh({ url, category, avatarScene, avatarBox }: { 
    url: string, 
    category: 'top' | 'bottom' | 'shoes', 
    avatarScene?: THREE.Group | null,
    avatarBox: THREE.Box3 | null
}) {
    const { scene } = useGLTF(url);
    const meshRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (!avatarScene || !scene || !avatarBox) return;

        // --- 1. Auto-Scaling & Positioning Logic ---
        const garmentBox = new THREE.Box3().setFromObject(scene);
        const garmentSize = garmentBox.getSize(new THREE.Vector3());
        const avatarSize = avatarBox.getSize(new THREE.Vector3());

        // Target height based on category percentage of avatar height
        let targetHeight = avatarSize.y * 0.4; // Default for Tops
        let yOffset = avatarBox.min.y + avatarSize.y * 0.7; // Default chest height

        if (category === 'bottom') {
            targetHeight = avatarSize.y * 0.45;
            yOffset = avatarBox.min.y + avatarSize.y * 0.35;
        } else if (category === 'shoes') {
            targetHeight = avatarSize.y * 0.1;
            yOffset = avatarBox.min.y + avatarSize.y * 0.05;
        }

        const scaleFactor = targetHeight / garmentSize.y;
        scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Center the garment horizontally, and set vertical offset
        scene.position.set(0, yOffset, 0);

        // --- 2. Skeletal Binding (Skinning) - Only if avatar exists ---
        if (avatarScene) {
            scene.traverse((obj) => {
                if ((obj as any).isSkinnedMesh) {
                    const garmentMesh = obj as THREE.SkinnedMesh;

                    avatarScene.traverse((target) => {
                        if ((target as any).isSkinnedMesh) {
                            const avatarMesh = target as THREE.SkinnedMesh;
                            // Bind garment mesh to avatar's skeleton
                            garmentMesh.bind(avatarMesh.skeleton, garmentMesh.matrixWorld);
                        }
                    });
                }
            });
        }
    }, [avatarScene, scene, avatarBox, category]);

    return <primitive ref={meshRef} object={scene} />;
}

export interface AvatarViewerRef {
    captureSnapshot: () => string | null;
}

const AvatarViewer = forwardRef<AvatarViewerRef>((_, ref) => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [avatarBox, setAvatarBox] = useState<THREE.Box3 | null>(null);

    // Provide ref access for parent components
    useImperativeHandle(ref, () => ({
        captureSnapshot: () => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                // Return base64 image
                return canvas.toDataURL('image/jpeg', 0.8);
            }
            return null;
        }
    }));

    // Access worn items from store
    const { wornItems } = useStudioStore();

    // Fetching avatar removed as requested

    // Camera Preset Functions via OrbitControls
    const setCameraAngle = (azimuthal: number, polar: number) => {
        if (controlsRef.current) {
            controlsRef.current.setAzimuthalAngle(azimuthal);
            controlsRef.current.setPolarAngle(polar);
            controlsRef.current.update();
        }
    };

    const handleCameraFront = () => setCameraAngle(0, Math.PI / 2);
    const handleCameraLeft = () => setCameraAngle(Math.PI / 2, Math.PI / 2); // Left Side
    const handleCameraRight = () => setCameraAngle(-Math.PI / 2, Math.PI / 2); // Right Side
    const handleCameraBack = () => setCameraAngle(Math.PI, Math.PI / 2);

    const handleResetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            controlsRef.current.update();
        }
    };

    return (
        <div className="w-full h-full relative bg-[#F9F8F6]">
            {/* Absolute positioned UI for Camera Presets - Boutique Style */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
                <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col gap-3">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] text-center mb-2 opacity-60">Perspective</p>

                    <button 
                        onClick={handleCameraFront} 
                        className="w-12 h-12 bg-white/80 hover:bg-black hover:text-white rounded-2xl text-gray-800 transition-all duration-500 flex items-center justify-center shadow-sm group active:scale-90"
                    >
                        <User size={18} className="group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </button>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleCameraLeft} 
                            className="w-12 h-12 bg-white/80 hover:bg-black hover:text-white rounded-2xl text-gray-800 transition-all duration-500 flex items-center justify-center shadow-sm group active:scale-90"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
                        </button>
                        <button 
                            onClick={handleCameraRight} 
                            className="w-12 h-12 bg-white/80 hover:bg-black hover:text-white rounded-2xl text-gray-800 transition-all duration-500 flex items-center justify-center shadow-sm group active:scale-90"
                        >
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                        </button>
                    </div>

                    <button 
                        onClick={handleCameraBack} 
                        className="w-12 h-12 bg-white/80 hover:bg-black hover:text-white rounded-2xl text-gray-800 transition-all duration-500 flex items-center justify-center shadow-sm group active:scale-90"
                    >
                        <Eye size={18} className="group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </button>

                    <div className="h-px bg-black/5 w-8 mx-auto my-1"></div>

                    <button 
                        onClick={handleResetCamera} 
                        className="w-12 h-12 bg-rose-50/50 hover:bg-rose-500 hover:text-white rounded-2xl text-rose-500 transition-all duration-500 flex items-center justify-center shadow-sm group active:scale-90"
                    >
                        <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            <Canvas 
                shadows 
                dpr={[1, 2]}
                camera={{ position: [0, 1.2, 3.5], fov: 40 }}
                gl={{ 
                    preserveDrawingBuffer: true,
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2
                }}
            >
                {/* Premium Boutique Background */}
                <color attach="background" args={['#F9F8F6']} />
                
                <Suspense fallback={<Loader />}>
                    {/* Cinematic Lighting & Environment */}
                    <Environment preset="apartment" />
                    <ambientLight intensity={0.4} />
                    <spotLight 
                        position={[5, 10, 5]} 
                        angle={0.15} 
                        penumbra={1} 
                        intensity={2} 
                        castShadow 
                        shadow-mapSize={1024}
                    />
                    <pointLight position={[-5, 5, -5]} intensity={0.5} color="#F9F8F6" />
                    
                    <group position={[0, -0.9, 0]}>
                        {/* Polished Ivory Floor */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                            <planeGeometry args={[50, 50]} />
                            <meshStandardMaterial 
                                color="#FFFFFF" 
                                roughness={0.05} 
                                metalness={0.1}
                                envMapIntensity={0.5}
                            />
                        </mesh>
                        
                        {/* Subtle Reflection Catchment */}
                        <ContactShadows 
                            opacity={0.4} 
                            scale={10} 
                            blur={2.4} 
                            far={0.8} 
                        />
                    </group>

                    <Stage 
                        shadows="contact" 
                        adjustCamera={false} 
                        intensity={0.5} 
                        environment={null} // We use our own environment
                    >
                        {/* Provide a dummy bounding box for garments to scale against (1.8m height) */}
                        {(() => {
                            if (!avatarBox) {
                                const box = new THREE.Box3(
                                    new THREE.Vector3(-0.4, -0.9, -0.2),
                                    new THREE.Vector3(0.4, 0.9, 0.2)
                                );
                                setAvatarBox(box);
                            }
                            return null;
                        })()}

                        {/* Worn Items Implementation */}
                        {/* BOTTOM */}
                        {wornItems.bottom && (
                            wornItems.bottom.meshUrl ? (
                                <GarmentMesh 
                                    avatarBox={avatarBox}
                                    url={wornItems.bottom.meshUrl} 
                                    category="bottom"
                                />
                            ) : wornItems.bottom.photos?.[0]?.url && (
                                <Html position={[0, -0.4, 0.05]} center transform sprite zIndexRange={[10, 0]}>
                                    <img 
                                        src={getImageUrl(wornItems.bottom.photos[0].url)} 
                                        alt="Bottom" 
                                        style={{ 
                                            width: '180px', 
                                            filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))',
                                            pointerEvents: 'none', 
                                            opacity: 0.95 
                                        }} 
                                    />
                                </Html>
                            )
                        )}

                        {/* TOP */}
                        {wornItems.top && (
                            wornItems.top.meshUrl ? (
                                <GarmentMesh 
                                    avatarBox={avatarBox}
                                    url={wornItems.top.meshUrl} 
                                    category="top"
                                />
                            ) : wornItems.top.photos?.[0]?.url && (
                                <Html position={[0, 0.25, 0.1]} center transform sprite zIndexRange={[10, 0]}>
                                    <img 
                                        src={getImageUrl(wornItems.top.photos[0].url)} 
                                        alt="Top" 
                                        style={{ 
                                            width: '200px', 
                                            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
                                            pointerEvents: 'none', 
                                            opacity: 0.95 
                                        }} 
                                    />
                                </Html>
                            )
                        )}

                        {/* SHOES */}
                        {wornItems.shoes && (
                            wornItems.shoes.meshUrl ? (
                                <GarmentMesh 
                                    avatarBox={avatarBox}
                                    url={wornItems.shoes.meshUrl} 
                                    category="shoes"
                                />
                            ) : wornItems.shoes.photos?.[0]?.url && (
                                <Html position={[0, -0.9, 0.05]} center transform sprite zIndexRange={[10, 0]}>
                                    <img 
                                        src={getImageUrl(wornItems.shoes.photos[0].url)} 
                                        alt="Shoes" 
                                        style={{ 
                                            width: '140px', 
                                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                                            pointerEvents: 'none', 
                                            opacity: 0.95 
                                        }} 
                                    />
                                </Html>
                            )
                        )}
                    </Stage>
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minDistance={1.8}
                    maxDistance={6}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.5}
                    target={[0, 0.6, 0]}
                    enablePan={false}
                    enableDamping={true}
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
});

export default AvatarViewer;
