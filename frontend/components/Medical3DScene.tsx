'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Medical3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Create glowing medical cross
    const crossGroup = new THREE.Group();

    // Vertical bar
    const vGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    const material = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const vBar = new THREE.Mesh(vGeometry, material);
    crossGroup.add(vBar);

    // Horizontal bar
    const hGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
    const hBar = new THREE.Mesh(hGeometry, material);
    crossGroup.add(hBar);

    crossGroup.position.set(-3, 2, 0);
    scene.add(crossGroup);

    // Create DNA helix
    const helixGroup = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const materialBlue = new THREE.MeshPhongMaterial({
      color: 0x1e3a8a,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
    });
    const materialCyan = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.3,
    });

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 4;
      const y = (i / 20) * 3 - 1.5;

      const sphere1 = new THREE.Mesh(sphereGeometry, materialBlue);
      sphere1.position.set(Math.cos(angle) * 0.5, y, Math.sin(angle) * 0.5);
      helixGroup.add(sphere1);

      const sphere2 = new THREE.Mesh(sphereGeometry, materialCyan);
      sphere2.position.set(Math.cos(angle + Math.PI) * 0.5, y, Math.sin(angle + Math.PI) * 0.5);
      helixGroup.add(sphere2);
    }

    helixGroup.position.set(3, 0, 0);
    scene.add(helixGroup);

    // Create floating pills
    const pillGeometry = new THREE.CapsuleGeometry(0.2, 0.6, 4, 8);
    const pillMaterial = new THREE.MeshPhongMaterial({
      color: 0x0ea5e9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.2,
    });

    const pill1 = new THREE.Mesh(pillGeometry, pillMaterial);
    pill1.position.set(0, -2, 1);
    pill1.rotation.z = Math.PI / 4;
    scene.add(pill1);

    const pill2 = new THREE.Mesh(pillGeometry, pillMaterial);
    pill2.position.set(-2, -1, 1);
    pill2.rotation.z = -Math.PI / 3;
    scene.add(pill2);

    // Create heart shape
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
    heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1);
    heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0);
    heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0);

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    });

    const heartMaterial = new THREE.MeshPhongMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.3,
    });

    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    heart.position.set(2, -2, 0);
    heart.scale.set(0.5, 0.5, 0.5);
    scene.add(heart);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x1e3a8a, 1, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate cross
      crossGroup.rotation.z += 0.005;
      crossGroup.rotation.y += 0.003;

      // Rotate DNA helix
      helixGroup.rotation.y += 0.01;

      // Rotate pills
      pill1.rotation.x += 0.02;
      pill1.rotation.y += 0.01;
      pill2.rotation.x += 0.015;
      pill2.rotation.y += 0.012;

      // Pulse heart
      const scale = 0.5 + Math.sin(Date.now() * 0.003) * 0.05;
      heart.scale.set(scale, scale, scale);
      heart.rotation.y += 0.01;

      // Camera follows mouse
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
