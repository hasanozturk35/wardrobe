import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html } from '@react-three/drei';
import React, { useRef, useState, useEffect, Suspense, useImperativeHandle, forwardRef } from 'react';
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
        <div className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-200">
            {/* Absolute positioned UI for Camera Presets */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white flex flex-col gap-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center my-1">KAMERA</p>

                    <button onClick={handleCameraFront} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-700 transition-all flex flex-col items-center justify-center gap-1 group">
                        <User size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Ön</span>
                    </button>

                    <div className="flex gap-2">
                        <button onClick={handleCameraLeft} className="p-2 flex-1 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-700 transition-all flex items-center justify-center group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <button onClick={handleCameraRight} className="p-2 flex-1 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-700 transition-all flex items-center justify-center group">
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <button onClick={handleCameraBack} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-700 transition-all flex flex-col items-center justify-center gap-1 group">
                        <Eye size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Arka</span>
                    </button>

                    <div className="h-px bg-gray-200 w-full my-1"></div>

                    <button onClick={handleResetCamera} className="p-3 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all flex flex-col items-center justify-center gap-1 group">
                        <RotateCcw size={16} className="group-hover:-rotate-45 transition-transform" />
                        <span className="text-[10px] font-bold">Sıfırla</span>
                    </button>
                </div>
            </div>

            <Canvas 
                shadows 
                camera={{ position: [0, 1.2, 3], fov: 45 }}
                gl={{ preserveDrawingBuffer: true }} // Important for toDataURL
            >
                <color attach="background" args={['#EDEEF0']} />

                <Suspense fallback={<Loader />}>
                    <Stage shadows={"contact"} adjustCamera={false} intensity={0.8} environment="city" preset="rembrandt">
                        {/* 1. Render a Floor/Grid instead of the Avatar (as requested to remove avatar) */}
                        <gridHelper args={[10, 10, 0xcccccc, 0xeeeeee]} position={[0, -0.9, 0]} />
                        
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

                        {/* 2. Render Worn Items: Check for 3D Mesh first, Fallback to 2D Overlay */}

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
                                    <img src={getImageUrl(wornItems.bottom.photos[0].url)} alt="Bottom" style={{ width: '180px', mixBlendMode: 'multiply', pointerEvents: 'none', opacity: 0.9 }} />
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
                                    <img src={getImageUrl(wornItems.top.photos[0].url)} alt="Top" style={{ width: '200px', mixBlendMode: 'multiply', pointerEvents: 'none', opacity: 0.9 }} />
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
                                    <img src={getImageUrl(wornItems.shoes.photos[0].url)} alt="Shoes" style={{ width: '140px', mixBlendMode: 'multiply', pointerEvents: 'none', opacity: 0.9 }} />
                                </Html>
                            )
                        )}
                    </Stage>
                </Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minDistance={1.5}
                    maxDistance={8}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                    target={[0, 0.8, 0]}
                    enablePan={false}
                />
            </Canvas>
        </div>
    );
});

export default AvatarViewer;
