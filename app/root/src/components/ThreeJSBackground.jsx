import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ThreeJSBackground = ({ handleToggle: externalHandleToggle }) => {
  const mountRef = useRef(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const starsRef = useRef(null);
  const nebulaRef = useRef(null);
  const barberPolesRef = useRef([]);

  // Handle toggle button for performance
  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    // Store preference in localStorage
    localStorage.setItem('barberia-3d-enabled', JSON.stringify(newState));
    // Call external toggle handler if provided
    if (externalHandleToggle) {
      externalHandleToggle(newState);
    }
  };

  useEffect(() => {
    // Check stored preference
    const savedPreference = localStorage.getItem('barberia-3d-enabled');
    if (savedPreference !== null) {
      setIsEnabled(JSON.parse(savedPreference));
    } else {
      // Auto-disable on mobile devices for better performance
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobile) {
        setIsEnabled(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isEnabled || !mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Dark space background
    scene.background = new THREE.Color(0x000510);
    
    // Camera with wide field of view for cosmic feel
    const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    rendererRef.current = renderer;
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting for cosmic effect
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);
    
    const blueLight = new THREE.PointLight(0x3677ff, 1, 50);
    blueLight.position.set(5, 5, 5);
    scene.add(blueLight);
    
    const purpleLight = new THREE.PointLight(0x9932cc, 1, 50);
    purpleLight.position.set(-5, -5, 5);
    scene.add(purpleLight);

    // Create star field
    const createStars = () => {
      const starCount = 2000;
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      
      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Create a sphere of stars around the camera
        const radius = 100 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        
        starPositions[i3] = radius * Math.sin(theta) * Math.cos(phi);
        starPositions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
        starPositions[i3 + 2] = radius * Math.cos(theta);
        
        // Vary star sizes for depth effect
        starSizes[i] = Math.random() * 2 + 0.5;
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      
      // Create shader material for stars with twinkling effect
      const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xffffff) }
        },
        vertexShader: `
          attribute float size;
          varying float vSize;
          uniform float time;
          
          void main() {
            vSize = size;
            // Add slight movement to stars
            vec3 pos = position;
            pos.x += sin(time * 0.1 + position.z * 0.01) * 0.5;
            pos.y += cos(time * 0.15 + position.x * 0.01) * 0.5;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            
            // Size attenuation for distant stars
            gl_PointSize = size * (600.0 / length(gl_Position.xyz));
            
            // Twinkle effect
            gl_PointSize *= 0.8 + 0.2 * sin(time + position.x * 100.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying float vSize;
          
          void main() {
            // Create circular point with soft edges
            float r = 0.5 * vSize;
            float d = distance(gl_PointCoord, vec2(0.5, 0.5));
            if (d > 0.5) discard;
            
            // Add glow effect
            float intensity = 1.0 - 2.0 * d;
            gl_FragColor = vec4(color, intensity);
          }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      return stars;
    };

    // Create nebula clouds
    const createNebula = () => {
      const group = new THREE.Group();
      
      // Create several nebula clouds with different colors
      const createNebulaCloud = (color, size, position) => {
        const cloudGeometry = new THREE.IcosahedronGeometry(size, 4);
        const cloudMaterial = new THREE.MeshPhongMaterial({
          color: color,
          transparent: true,
          opacity: 0.2,
          emissive: color,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
          wireframe: false
        });
        
        // Distort the geometry for cloud-like effect
        const positions = cloudGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positions, i);
          
          vertex.normalize().multiplyScalar(size);
          
          // Add noise to the vertex
          vertex.x += (Math.random() - 0.5) * size * 0.3;
          vertex.y += (Math.random() - 0.5) * size * 0.3;
          vertex.z += (Math.random() - 0.5) * size * 0.3;
          
          positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        // Update the geometry to apply changes
        cloudGeometry.computeVertexNormals();
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(position.x, position.y, position.z);
        return cloud;
      };
      
      // Create multiple nebula clouds with different colors
      const purpleNebula = createNebulaCloud(0x9900ff, 20, { x: 30, y: 0, z: -70 });
      const blueNebula = createNebulaCloud(0x0066ff, 25, { x: -40, y: 10, z: -50 });
      const pinkNebula = createNebulaCloud(0xff66cc, 15, { x: 0, y: -25, z: -40 });
      
      group.add(purpleNebula);
      group.add(blueNebula);
      group.add(pinkNebula);
      
      return group;
    };

    // Create cosmic barber pole
    const createCosmicBarberPole = (position) => {
      const group = new THREE.Group();
      
      // Base cylinder with glow
      const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 32);
      const poleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x000000,
        emissive: 0x222244,
        emissiveIntensity: 0.5
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      
      // Create cosmic spiral texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 256, 512);
      
      // Draw cosmic spiral
      const stripeWidth = 60;
      
      // Cyan stripes
      ctx.fillStyle = '#00ffff';
      for (let y = -stripeWidth*2; y < canvas.height + stripeWidth*2; y += stripeWidth*3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + stripeWidth*2);
        ctx.lineTo(canvas.width, y + stripeWidth*3);
        ctx.lineTo(0, y + stripeWidth);
        ctx.closePath();
        ctx.fill();
      }
      
      // Magenta stripes
      ctx.fillStyle = '#ff00ff';
      for (let y = -stripeWidth; y < canvas.height + stripeWidth*2; y += stripeWidth*3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + stripeWidth*2);
        ctx.lineTo(canvas.width, y + stripeWidth*3);
        ctx.lineTo(0, y + stripeWidth);
        ctx.closePath();
        ctx.fill();
      }
      
      // Add stars to the texture
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const spiralTexture = new THREE.CanvasTexture(canvas);
      spiralTexture.wrapS = THREE.RepeatWrapping;
      spiralTexture.wrapT = THREE.RepeatWrapping;
      spiralTexture.repeat.set(1, 3); // Repeat vertically
      
      const spiralMaterial = new THREE.MeshStandardMaterial({
        map: spiralTexture,
        roughness: 0.4,
        metalness: 0.8,
        emissive: 0xffffff,
        emissiveIntensity: 0.5,
        emissiveMap: spiralTexture
      });
      
      const spiralCylinder = new THREE.CylinderGeometry(0.42, 0.42, 6.01, 32);
      const spiral = new THREE.Mesh(spiralCylinder, spiralMaterial);
      
      // Add end caps with glow
      const capGeometry = new THREE.SphereGeometry(0.6, 32, 32);
      const topCapMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8
      });
      
      const bottomCapMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.8
      });
      
      const topCap = new THREE.Mesh(capGeometry, topCapMaterial);
      topCap.position.y = 3.2;
      
      const bottomCap = new THREE.Mesh(capGeometry, bottomCapMaterial);
      bottomCap.position.y = -3.2;
      
      group.add(pole);
      group.add(spiral);
      group.add(topCap);
      group.add(bottomCap);
      
      // Add glow effect
      const glowGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6.4, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8800ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      group.add(glow);
      
      // Position and rotate
      group.position.set(position.x, position.y, position.z);
      group.rotation.x = Math.PI * 0.05;
      
      return group;
    };

    // Create objects
    const stars = createStars();
    const nebula = createNebula();
    
    // Create barber poles on left and right sides of the screen
    const leftPole = createCosmicBarberPole({ x: -6, y: 0, z: -5 });
    const rightPole = createCosmicBarberPole({ x: 6, y: 0, z: -5 });
    
camera.add(leftPole);
camera.add(rightPole);
scene.add(camera);
    // Store references
    starsRef.current = stars;
    nebulaRef.current = nebula;
    barberPolesRef.current = [leftPole, rightPole];
    
    // Add to scene
    scene.add(stars);
    scene.add(nebula);
    // scene.add(leftPole);
    // scene.add(rightPole);
    
    // Animation
    const clock = new THREE.Clock();
    
    const animate = () => {
      if (!isEnabled) return;
      
      const time = clock.getElapsedTime();
      
      // Update star shader time uniform for twinkling
      if (stars && stars.material.uniforms) {
        stars.material.uniforms.time.value = time;
      }
      
      // Rotate nebula clouds slowly
      if (nebula) {
        nebula.rotation.y = time * 0.05;
        nebula.rotation.x = Math.sin(time * 0.025) * 0.1;
        nebula.children.forEach((cloud, i) => {
          cloud.rotation.y = time * 0.1 * (i + 1) * 0.1;
          cloud.rotation.z = time * 0.05 * (i + 1) * 0.1;
        });
      }
      
      // Animate barber poles
      barberPolesRef.current.forEach(pole => {
        if (pole) {
          // Rotate spiral texture
          pole.children[1].rotation.y = time * 0.5;
          
          // Pulse glow
          const glow = pole.children[4]; // glow mesh
          if (glow) {
            glow.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
          }
          
          // Slight floating motion
          pole.position.y = Math.sin(time * 0.3) * 0.5;
        }
      });
      
      // Slowly rotate camera for cosmic effect
      camera.position.x = Math.sin(time * 0.05) * 2;
      camera.position.y = Math.cos(time * 0.05) * 2;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animate();
    setIsLoaded(true);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      
      // Clear references
      sceneRef.current = null;
      rendererRef.current = null;
      starsRef.current = null;
      nebulaRef.current = null;
      barberPolesRef.current = [];
    };
  }, [isEnabled]);
  
  return (
    <>
      <div 
        ref={mountRef} 
        className="fixed top-0 left-0 w-full h-full z-0"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Toggle button with higher z-index to ensure visibility */}
      <button 
        onClick={handleToggle}
        className="fixed bottom-4 right-4 z-[9999] p-2 rounded-full shadow-lg bg-purple-700 text-white"
        aria-label={isEnabled ? "Disable Cosmic Background" : "Enable Cosmic Background"}
        title={isEnabled ? "Disable Cosmic Background" : "Enable Cosmic Background"}
        style={{
          boxShadow: isEnabled ? '0 0 10px 3px rgba(138, 43, 226, 0.7)' : 'none',
          transition: 'box-shadow 0.3s ease',
          pointerEvents: 'auto' // Ensure button is clickable
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2l.66.37 3.78 1.97L12 2l1.56 2.34L17.34 6l-2.34 1.56L17.34 9.12 12 18l-5.34-8.88L4.32 7.56 2 6l1.56-2.34L7.34 2z" />
        </svg>
      </button>
      
      {!isLoaded && isEnabled && (
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-cyan-400 flex flex-col items-center">
            <div className="loading loading-spinner loading-lg text-fuchsia-500 mb-3"></div>
            <div>Loading cosmic background...</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThreeJSBackground;