"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

const ModelViewer = ({ modelUrl }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0114);


    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add controls for spinning/rotation
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 1;

    const controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.dynamicDampingFactor = 0.3;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // PLY Loader to load the 3D model
    const loader = new PLYLoader();
    loader.load(
      modelUrl,
      (geometry) => {
        // Center the geometry
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.center();

        // Scale the geometry to fit nicely in the view
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        geometry.scale(scale, scale, scale);

        // Add normals if they don't exist
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }

        // Create material
        const material = new THREE.MeshStandardMaterial({
          // color: 0x3b82f6, // Blue to match your UI
          color: 0xdec9f0,
          flatShading: false,
          vertexColors: geometry.attributes.color ? true : false,
        });

        // Create mesh and add to scene
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        setLoading(false);
      },
      (xhr) => {
        // Progress callback
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        // Error callback
        console.error('Error loading PLY file:', error);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup function
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <div className="w-full h-[600px] md:h-[800px] relative rounded-lg overflow-hidden shadow-xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-red-400 text-center px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full"></div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3 text-white text-sm">
        <div className="text-center font-bold mb-2">Legend</div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <div>Edema</div>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
          <div>Tumor Core</div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-white mr-2"></div>
          <div>Healthy Tissue</div>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;