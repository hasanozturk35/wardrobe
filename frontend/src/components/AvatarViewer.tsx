import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RotateCcw } from 'lucide-react';

// A simple placeholder avatar since we don't have a GLB file yet.
function PlaceholderAvatar() {
    return (
        <mesh castShadow receiveShadow position={[0, 1, 0]}>
            <boxGeometry args={[1, 2, 0.5]} />
            <meshStandardMaterial color="#646cff" />
        </mesh>
    );
}

export function AvatarViewer() {
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const handleResetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            // OrbitControls often requires an update after manual resets
            controlsRef.current.update();
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Absolute positioned UI for viewer controls */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 10,
                    background: 'rgba(255,255,255,0.8)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                <button
                    onClick={handleResetCamera}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    <RotateCcw size={18} />
                    Reset Camera
                </button>
            </div>

            <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
                <color attach="background" args={['#f0f0f0']} />

                {/* Stage sets up nice lighting and shadows automatically */}
                <Stage adjustCamera={false} intensity={0.5} environment="city">
                    <PlaceholderAvatar />
                </Stage>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minDistance={2}
                    maxDistance={10}
                    target={[0, 1, 0]}
                />
            </Canvas>
        </div>
    );
}
