const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealTargets = document.querySelectorAll("[data-reveal]");
if (revealTargets.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

const depthTargets = document.querySelectorAll("[data-depth]");
let depthFrame = 0;

const syncDepth = () => {
  depthFrame = 0;
  if (prefersReducedMotion || window.innerWidth < 821) {
    depthTargets.forEach((target) => target.style.setProperty("--parallax-y", "0px"));
    return;
  }

  const center = window.innerHeight * 0.5;
  depthTargets.forEach((target) => {
    const depth = Number(target.dataset.depth || "0");
    const rect = target.getBoundingClientRect();
    const offset = (rect.top + rect.height * 0.5 - center) * depth * -0.16;
    target.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  });
};

const requestDepthSync = () => {
  if (depthFrame) return;
  depthFrame = window.requestAnimationFrame(syncDepth);
};

window.addEventListener("scroll", requestDepthSync, { passive: true });
window.addEventListener("resize", requestDepthSync);
requestDepthSync();

const initHeroScene = async () => {
  const canvas = document.querySelector("[data-hero-canvas]");
  if (!canvas || prefersReducedMotion) return;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js");
  } catch {
    canvas.hidden = true;
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.1, 8.4);

  const group = new THREE.Group();
  group.position.set(1.35, 0.05, 0);
  scene.add(group);

  const crystalGeometry = new THREE.IcosahedronGeometry(1.72, 2);
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#87d7ff"),
    metalness: 0.14,
    roughness: 0.18,
    transmission: 0.58,
    thickness: 0.9,
    transparent: true,
    opacity: 0.42,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
  });
  const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
  crystal.rotation.set(0.2, 0.42, -0.18);
  group.add(crystal);

  const wire = new THREE.Mesh(
    crystalGeometry,
    new THREE.MeshBasicMaterial({
      color: "#f4d58d",
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    }),
  );
  wire.scale.setScalar(1.015);
  group.add(wire);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: "#f7d28a",
    transparent: true,
    opacity: 0.22,
  });

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.006, 10, 180), ringMaterial);
  ringA.rotation.set(Math.PI * 0.5, 0.1, 0.46);
  group.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.005, 10, 180), ringMaterial.clone());
  ringB.material.opacity = 0.16;
  ringB.rotation.set(0.55, Math.PI * 0.5, -0.24);
  group.add(ringB);

  const particleCount = 620;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 4.2 + Math.random() * 8.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius * 0.56;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 3.2;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: "#d8f3ff",
      size: 0.018,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  scene.add(particles);

  const lightA = new THREE.DirectionalLight("#ffffff", 2.2);
  lightA.position.set(3.4, 3.6, 5.2);
  scene.add(lightA);

  const lightB = new THREE.PointLight("#f4c66e", 5.5, 18);
  lightB.position.set(-3.4, -1.1, 3.8);
  scene.add(lightB);

  scene.add(new THREE.AmbientLight("#6fb8ff", 0.55));

  const pointer = { x: 0, y: 0 };
  let scrollRatio = 0;
  let frameId = 0;

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  const updateScrollRatio = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    scrollRatio = Math.min(window.scrollY / max, 1);
  };

  const animate = () => {
    frameId = window.requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    const heroProgress = Math.min(scrollRatio * 2.8, 1);

    group.rotation.y = time * 0.12 + heroProgress * 1.45 + pointer.x * 0.18;
    group.rotation.x = 0.18 + Math.sin(time * 0.42) * 0.05 + pointer.y * 0.12;
    group.rotation.z = -0.08 + heroProgress * 0.28;
    group.position.y = Math.sin(time * 0.48) * 0.08 - heroProgress * 0.62;
    group.position.x = window.innerWidth < 760 ? 0.45 : 1.35 + heroProgress * 0.28;

    crystal.scale.setScalar(1 + Math.sin(time * 0.8) * 0.018);
    ringA.rotation.z = time * 0.18;
    ringB.rotation.x = time * -0.14;
    particles.rotation.y = time * 0.012 + scrollRatio * 0.5;
    particles.rotation.x = scrollRatio * 0.12;
    camera.position.z = 8.4 - heroProgress * 0.7;
    renderer.render(scene, camera);
  };

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", updateScrollRatio, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * -2;
  });

  resize();
  updateScrollRatio();
  animate();

  window.addEventListener("pagehide", () => {
    window.cancelAnimationFrame(frameId);
    crystalGeometry.dispose();
    particleGeometry.dispose();
    crystalMaterial.dispose();
    wire.material.dispose();
    ringMaterial.dispose();
    ringB.material.dispose();
    renderer.dispose();
  });
};

initHeroScene();
