/**
 * GTC HIMALAYAN · 3D WEBGL HERO SECTION ENGINE (hero-3d.js)
 * ═══════════════════════════════════════════════════════════════════════
 * Dual-Layer Environment Pipeline: Crisp 8K PNG Visuals + Physical EXR IBL Lighting
 * 
 * Mechanical Features & Interaction Architecture:
 * 1. Dynamic 360 Background Panning:
 *    Dragging to rotate the watch synchronously pans bgSphere1, bgSphere2,
 *    and scene.environmentRotation so the 360 Himalayan landscape turns with it.
 * 2. Exact Touch / Click to Focus:
 *    Tapping or clicking the watch smoothly dollies the camera in (FOV: 45° -> 22°, Z: 12 -> 4)
 *    to focus on the ultra-sharp landscape details and fades in the editorial origin badge.
 * 3. 360° Drag Threshold Variant Morphing Sequence:
 *    When accumulated rotation reaches 360° (2π radians) and the watch faces front:
 *    a) Locks drag controls (isMorphing = true).
 *    b) Zoom Out: Camera smoothly pulls back out to wide landscape view (FOV 45, Z 12).
 *    c) Dual Crossfade Sequence (1.2s ease):
 *       - Crossfades visual PNG spheres.
 *       - Interpolates scene.environment to new matching EXR radiance map.
 *       - Interpolates dial color, roughness, metalness, and chassis/bracelet metal tint on PBR mesh.
 *       - Crossfades narrative text and UI pills.
 *    d) Zoom In: Camera immediately glides forward into the new feature (FOV 22, Z 4).
 *    e) Unlocks drag controls with isZoomed = true.
 * 4. Traversal & Developer Hack:
 *    Logs console.log("Mesh:", child.name, "Material:", child.material.name) and replaces:
 *    - Dial with dial_base.webp texture and variant PBR parameters
 *    - Case/bracelet with metallic MeshStandardMaterial
 *    - Crystal with transmissive MeshPhysicalMaterial (transmission: 0.95, roughness: 0.05, ior: 1.5)
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import gsap from 'gsap';

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ─── 1. THE 4 WATCH VARIANTS (PBR SPECIFICATIONS & INSPIRATIONS) ────
export const VARIANTS = [
  {
    id: 'glacial-twilight',
    name: 'GLACIAL TWILIGHT',
    eyebrow: '01 / 04 · ORIGIN',
    title: 'GLACIAL TWILIGHT',
    body: 'Inspired by the pristine, deep blue glacial lakes of the high Himalayas at twilight.',
    altitude: 'Karakoram Glaciers · 6,800m',
    ref: 'REF. HIM-GT-2601',
    elevationVal: '6,800 M',
    // PBR Material Settings
    dialColor: '#0A192F',       // Deep Navy Blue
    dialRoughness: 0.35,
    dialMetalness: 0.10,
    chassisColor: '#E5E5E5',    // Precision Silver Steel
    chassisRoughness: 0.15,
    chassisMetalness: 0.95,
    bezelColor: '#B0C4DE',      // Light steel blue accent
    // Assets (Optimized WebP for instantaneous mobile/desktop load)
    bgUrl: '/assets/3d/bg_glacial_blue.webp',
    lightUrl: '/assets/3d/light_glacial_blue.exr',
    accentDotColor: '#38bdf8',
  },
  {
    id: 'mineral-slate',
    name: 'MINERAL SLATE',
    eyebrow: '02 / 04 · ORIGIN',
    title: 'MINERAL SLATE',
    body: 'Inspired by the raw, dark slate rocks and rugged mineral cliffs of the Himalayan ridge.',
    altitude: 'Everest North Face · 8,400m',
    ref: 'REF. HIM-MS-2602',
    elevationVal: '8,400 M',
    // PBR Material Settings
    dialColor: '#121212',       // Velvet Mineral Black
    dialRoughness: 0.40,
    dialMetalness: 0.10,
    chassisColor: '#FFFFFF',    // Brushed Antique Gold
    chassisRoughness: 0.22,
    chassisMetalness: 0.90,
    bezelColor: '#A68230',      // Deep antique gold rim
    // Assets
    bgUrl: '/assets/3d/bg_dark_rock.webp',
    lightUrl: '/assets/3d/light_dark_rock.exr',
    accentDotColor: '#FFFFFF',
  },
  {
    id: 'summit-ice',
    name: 'SUMMIT ICE',
    eyebrow: '03 / 04 · ORIGIN',
    title: 'SUMMIT ICE',
    body: 'Inspired by endless snow-capped peaks catching early morning alpine sunlight.',
    altitude: 'Kangchenjunga Apex · 8,586m',
    ref: 'REF. HIM-SI-2603',
    elevationVal: '8,586 M',
    // PBR Material Settings
    dialColor: '#DCE4EC',       // Crisp silver-glacial metallic contrast (sharp fluted topography)
    dialRoughness: 0.22,
    dialMetalness: 0.28,        // Crisp metallic sheen preventing flat chalky wash
    chassisColor: '#E2E8F0',    // Precision glacial platinum / steel
    chassisRoughness: 0.18,
    chassisMetalness: 0.95,
    bezelColor: '#CBD5E1',      // Polished fluted metallic contrast
    // Assets
    bgUrl: '/assets/3d/bg_snow_summit.webp',
    lightUrl: '/assets/3d/light_snow_summit.exr',
    accentDotColor: '#E8D6B3',
  },
  {
    id: 'alpine-pine',
    name: 'ALPINE PINE',
    eyebrow: '04 / 04 · ORIGIN',
    title: 'ALPINE PINE',
    body: 'Inspired by resilient pine tree forests and green meadows nestled in the lower valleys.',
    altitude: 'Parvati Valley · 3,200m',
    ref: 'REF. HIM-AP-2604',
    elevationVal: '3,200 M',
    // PBR Material Settings
    dialColor: '#1A3323',       // Deep Forest Green
    dialRoughness: 0.35,
    dialMetalness: 0.10,
    chassisColor: '#E5E5E5',    // Precision Silver Steel
    chassisRoughness: 0.15,
    chassisMetalness: 0.95,
    bezelColor: '#244530',      // Pine green bezel ring
    // Assets
    bgUrl: '/assets/3d/bg_alpine_forest.webp',
    lightUrl: '/assets/3d/light_alpine_forest.exr',
    accentDotColor: '#10B981',
  },
];

export class HimalayanHero3D {
  constructor(canvasSelector = '#hero-canvas') {
    this.canvas = document.querySelector(canvasSelector);
    if (!this.canvas) {
      console.warn(`[HimalayanHero3D] Canvas container ${canvasSelector} not found.`);
      return;
    }

    this.currentVariantIndex = 0;
    this.isZoomed = false;
    this.isMorphing = false;

    // Interaction & Cumulative Drag Tracking
    this.isDragging = false;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.dragDistance = 0;
    this.accumulatedRotation = 0;

    // Material Collections
    this.dialMaterials = [];
    this.caseMaterials = [];
    this.bezelMaterials = [];
    this.handsMaterials = [];

    // Preloaded Asset Caches
    this.bgTextures = {};
    this.envMaps = {};

    this.init();
  }

  init() {
    this.setupScene();
    this.setupDualSkySpheres();
    this.setupLighting();
    this.loadWatchModel();
    this.preloadVariantAssets();
    this.setupInteractionListeners();
    this.setupUIBindings();
    this.animate();

    console.log('[HimalayanHero3D] Initialized with dual-layer environment and dynamic background panning.');
  }

  // ─── 2. SCENE, CAMERA & RENDERER SETUP ────────────────────────
  setupScene() {
    this.scene = new THREE.Scene();

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    this.camera.position.set(0, 0, 12);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    const pixelRatio = isMobile 
      ? Math.min(window.devicePixelRatio || 1, 1.35) 
      : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !isMobile; // Disable expensive dynamic shadow maps on mobile
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Environment map rotation initialization if supported
    if (this.scene.environmentRotation === undefined) {
      this.scene.environmentRotation = new THREE.Euler(0, 0, 0);
    }

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // Instant Procedural Studio Lighting Environment (Zero Latency Fallback)
    const defaultEnv = this.createProceduralStudioEnv();
    this.scene.environment = defaultEnv;
    this.defaultEnv = defaultEnv;

    // Watch Root Pivot Group
    this.watchGroup = new THREE.Group();
    this.scene.add(this.watchGroup);

    // Visibility Observer to stop rendering when scrolled out of view
    this.isVisible = true;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const heroSection = document.getElementById('hero') || this.canvas;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(heroSection);
    }

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  createProceduralStudioEnv() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#2e3d4c');
    grad.addColorStop(0.45, '#161c22');
    grad.addColorStop(0.55, '#0c1014');
    grad.addColorStop(1, '#050709');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    const softbox = ctx.createRadialGradient(256, 45, 5, 256, 45, 120);
    softbox.addColorStop(0, 'rgba(255, 248, 230, 0.95)');
    softbox.addColorStop(0.45, 'rgba(255, 255, 255, 0.4)');
    softbox.addColorStop(1, 'transparent');
    ctx.fillStyle = softbox;
    ctx.fillRect(0, 0, 512, 170);

    const rimLeft = ctx.createRadialGradient(70, 128, 5, 70, 128, 80);
    rimLeft.addColorStop(0, 'rgba(180, 215, 255, 0.65)');
    rimLeft.addColorStop(1, 'transparent');
    ctx.fillStyle = rimLeft;
    ctx.fillRect(0, 40, 160, 180);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    return envMap;
  }

  onWindowResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const pixelRatio = isMobile 
      ? Math.min(window.devicePixelRatio || 1, 1.35) 
      : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
  }

  // ─── 3. DUAL-SPHERE VISUAL SKY SPHERES (CRISP 8K PNGs) ─────────
  setupDualSkySpheres() {
    // Two concentric inverted sky spheres with anisotropic filtering set to 16
    const sphereGeo1 = new THREE.SphereGeometry(500, 64, 48);
    const sphereGeo2 = new THREE.SphereGeometry(498, 64, 48);

    this.skyMat1 = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    this.skyMat2 = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.bgSphere1 = new THREE.Mesh(sphereGeo1, this.skyMat1);
    this.bgSphere2 = new THREE.Mesh(sphereGeo2, this.skyMat2);

    this.scene.add(this.bgSphere1);
    this.scene.add(this.bgSphere2);
  }

  // ─── 4. PHYSICAL LIGHTING ─────────────────────────────────────
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    // Key Light
    this.keyLight = new THREE.DirectionalLight(0xf8f5ef, 2.6);
    this.keyLight.position.set(5, 6, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0001;
    this.scene.add(this.keyLight);

    // Warm Fill Light
    this.fillLight = new THREE.DirectionalLight(0xe8d6b3, 1.5);
    this.fillLight.position.set(-6, 3, 4);
    this.scene.add(this.fillLight);

    // Specular Rim Light for chamfered edges
    this.rimLight = new THREE.DirectionalLight(0xc9a84c, 2.0);
    this.rimLight.position.set(0, 5, -6);
    this.scene.add(this.rimLight);
  }

  // ─── 5. GLB MODEL LOADING & PBR NODE MAPPING ─────────────────
  loadWatchModel() {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // 1. Preload Dial Texture (Optimized WebP)
    const dialTexture = textureLoader.load('/assets/textures/dial_base.webp');
    dialTexture.colorSpace = THREE.SRGBColorSpace;
    dialTexture.flipY = false; // Required for GLTF UV mapping standard
    dialTexture.generateMipmaps = true;
    dialTexture.minFilter = THREE.LinearMipmapLinearFilter;
    dialTexture.magFilter = THREE.LinearFilter;

    // UV Alignment presets & live console controls
    dialTexture.center.set(0.5, 0.5);
    // dialTexture.rotation = Math.PI; // Rotate 180° if upside down
    // dialTexture.repeat.set(1.0, 1.0); // Scale up/down
    // dialTexture.offset.set(0.0, 0.0); // Shift X/Y
    window.dialTexture = dialTexture;

    const initialVar = VARIANTS[0];

    // 2. Configure this.dialMaterial (pure white base to prevent graphic tinting)
    this.dialMaterial = new THREE.MeshStandardMaterial({
      map: dialTexture,
      roughness: 0.35,
      metalness: 0.1,
      color: new THREE.Color(0xffffff), // Pure white so it does not tint the original graphic
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
    });
    this.dialMaterials.push(this.dialMaterial);

    // Crystal Glass Physical Material (transmissive, transmission: 0.95, roughness: 0.05, ior: 1.5)
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      roughness: 0.05,
      ior: 1.5,
      transparent: true,
      opacity: 1,
      color: 0xffffff,
      reflectivity: 0.5,
      envMapIntensity: 2.0,
      depthWrite: false,
    });

    // Case & Bracelet Metallic Material
    this.caseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialVar.chassisColor),
      roughness: initialVar.chassisRoughness,
      metalness: initialVar.chassisMetalness,
      envMapIntensity: 2.2,
    });
    this.caseMaterials.push(this.caseMaterial);

    // Bezel Accent Material
    this.bezelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialVar.bezelColor),
      roughness: 0.16,
      metalness: 0.94,
      envMapIntensity: 2.5,
    });
    this.bezelMaterials.push(this.bezelMaterial);

    // Hands Material
    this.handsMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.12,
      metalness: 0.98,
      envMapIntensity: 2.8,
    });
    this.handsMaterials.push(this.handsMaterial);

    // Fast preload match: '/assets/3d/watch_1.glb' matches HTML <link rel="preload"> exactly
    const modelPaths = ['/assets/3d/watch_1.glb', '/assets/models/watch.glb'];

    const tryLoadModel = (index) => {
      if (index >= modelPaths.length) {
        console.error('[HimalayanHero3D] Failed to load watch model from all paths.');
        return;
      }

      gltfLoader.load(
        modelPaths[index],
        (gltf) => {
          const model = gltf.scene;

          console.group('[Developer Hack] Traversed GLB Nodes & Materials');

          model.traverse((child) => {
            if (child.isMesh) {
              const materialName = child.material
                ? (Array.isArray(child.material) ? child.material.map((m) => m.name).join(', ') : child.material.name)
                : 'none';

              // Developer inspection log
              console.log("Mesh:", child.name, "Material:", materialName);

              const nodeLower = child.name.toLowerCase();
              const matLower = materialName.toLowerCase();

              // 2. Hide Duplicate 3D Hands:
              // Since the custom dial texture (dial_base.webp) already has watch hands printed on it,
              // hide the physical 3D hands, logos, date/day cutouts and numerals to prevent double-hand ghosting
              if (
                nodeLower.includes('arrow') || 
                nodeLower.includes('hand') || 
                nodeLower.includes('logo') || 
                nodeLower === 'numbers' || 
                nodeLower.includes('tablo_')
              ) {
                child.visible = false;
                return;
              }

              child.castShadow = true;
              child.receiveShadow = true;

              // 1. Glass Assignment Fix:
              // ONLY assign this.glassMaterial to meshes whose name explicitly matches the primary crystal lens
              // (e.g. nodeLower === 'plane052' || nodeLower === 'circle051').
              // Any secondary rings, inner bezels, or plates (circle051_1, plane052_1) MUST receive this.caseMaterial
              // so the watch body remains completely solid and opaque.
              if (
                (nodeLower === 'plane052' || nodeLower === 'circle051' || nodeLower === 'circle.051' || nodeLower === 'plane.052') &&
                !nodeLower.includes('_1')
              ) {
                child.material = this.glassMaterial;
                child.castShadow = false; // Crystal lens should not cast opaque shadow over the dial
              }
              // Main Dial Face (strict match on primary tablo)
              else if (nodeLower === 'tablo' || matLower === 'tablo_rolex') {
                child.material = this.dialMaterial;

                // 3. Hole at 3 o'clock:
                // The Rolex mesh has a physical date cutout creating an empty black void.
                // Seal the date cutout and any day window from behind with matching dial material backing disc.
                if (!child.getObjectByName('dial_backing_seal')) {
                  const dialBackingGeo = new THREE.CircleGeometry(0.0185, 48);
                  const dialBacking = new THREE.Mesh(dialBackingGeo, this.dialMaterial);
                  dialBacking.name = 'dial_backing_seal';
                  dialBacking.position.set(0, -0.0001, 0);
                  dialBacking.rotation.x = -Math.PI / 2;
                  child.add(dialBacking);
                }
              }
              // Bezel & Fasteners
              else if (nodeLower.includes('bezel') || nodeLower.includes('bolt') || nodeLower.includes('fastener')) {
                child.material = this.bezelMaterial;
              }
              // Secondary rings, inner bezels, or plates (circle051_1, plane052_1), case body & bracelet -> solid caseMaterial
              else {
                child.material = this.caseMaterial;
              }
            }
          });

          console.groupEnd();

          // Auto-center and normalize scale for camera distance
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          const targetDim = 5.2;
          const scaleFactor = targetDim / (maxDim || 1);

          model.scale.setScalar(scaleFactor);
          model.position.set(-center.x * scaleFactor, -center.y * scaleFactor, -center.z * scaleFactor);

          this.watchGroup.add(model);
          this.watchModel = model;
          window.watch = model;

          // Ground contact shadow to anchor watch naturally in 3D alpine space
          const contactShadowGeo = new THREE.PlaneGeometry(8, 8);
          const contactShadowMat = new THREE.MeshBasicMaterial({
            map: createContactShadowTexture(),
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          });
          const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
          contactShadow.rotation.x = -Math.PI / 2;
          contactShadow.position.set(0, -2.85, 0);
          this.watchGroup.add(contactShadow);

          // Gentle ambient floating breathing
          this.startIdleFloating();
        },
        (xhr) => {
          const percent = Math.round((xhr.loaded / (xhr.total || 1)) * 100);
          const progressEl = document.getElementById('hero-load-progress');
          if (progressEl && percent <= 100) {
            progressEl.style.width = `${percent}%`;
          }
        },
        (err) => {
          console.warn(`[HimalayanHero3D] Could not load ${modelPaths[index]}, trying fallback:`, err);
          tryLoadModel(index + 1);
        }
      );
    };

    tryLoadModel(0);
  }

  startIdleFloating() {
    gsap.to(this.watchGroup.position, {
      y: 0.12,
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ─── 6. ASSET PRELOADING (OPTIMIZED PROGRESSIVE LOADING) ─────────
  preloadVariantAssets() {
    const isMobileClient = typeof window !== 'undefined' && 
      (window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    const textureLoader = new THREE.TextureLoader();
    const exrLoader = new EXRLoader();
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const loadVariant = (index) => {
      const variant = VARIANTS[index];
      if (!variant) return;

      // 1. Load Background WebP
      if (!this.bgTextures[variant.id]) {
        textureLoader.load(variant.bgUrl, (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.anisotropy = Math.min(maxAnisotropy, isMobileClient ? 2 : 8);
          this.bgTextures[variant.id] = texture;

          if (index === 0 && !this.skyMat1.map) {
            this.skyMat1.map = texture;
            this.skyMat1.needsUpdate = true;
          }
        });
      }

      // 2. Lighting Map
      if (!this.envMaps[variant.id]) {
        // On mobile: procedural studio environment provides crisp, lag-free reflections with 0 extra MBs downloaded
        if (isMobileClient) {
          this.envMaps[variant.id] = this.defaultEnv;
          if (index === 0) {
            this.scene.environment = this.defaultEnv;
          }
          return;
        }

        // On desktop: stream physical EXR map
        exrLoader.load(
          variant.lightUrl,
          (exrTexture) => {
            try {
              exrTexture.mapping = THREE.EquirectangularReflectionMapping;
              const envMap = this.pmremGenerator.fromEquirectangular(exrTexture).texture;
              this.envMaps[variant.id] = envMap;
              exrTexture.dispose();

              if (index === 0) {
                this.scene.environment = envMap;
              }
            } catch (pErr) {
              console.warn('[HimalayanHero3D] PMREM generation failed for EXR, using procedural fallback:', pErr);
              this.envMaps[variant.id] = this.defaultEnv;
            }
          },
          undefined,
          (err) => {
            console.warn(`[HimalayanHero3D] Could not load EXR ${variant.lightUrl}, using procedural studio lighting fallback:`, err);
            this.envMaps[variant.id] = this.defaultEnv;
          }
        );
      }
    };

    // Load initial variant immediately
    loadVariant(0);

    // On mobile, lazy load remaining backgrounds only after initial render is settled
    if (isMobileClient) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          setTimeout(() => {
            for (let i = 1; i < VARIANTS.length; i++) {
              loadVariant(i);
            }
          }, 3500);
        });
      }
    } else {
      // On desktop, smoothly stagger remaining variant preloads
      setTimeout(() => {
        for (let i = 1; i < VARIANTS.length; i++) {
          setTimeout(() => loadVariant(i), i * 800);
        }
      }, 1800);
    }
  }

  // ─── 7. INTERACTION ENGINE WITH DYNAMIC 360 BACKGROUND PANNING ──
  setupInteractionListeners() {
    const target = this.canvas;

    target.addEventListener('pointerdown', (e) => {
      if (this.isMorphing) return; // Locked during morph transition

      this.isDragging = true;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.dragDistance = 0;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || this.isMorphing) return;

      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      this.dragDistance += Math.hypot(e.clientX - this.lastPointerX, e.clientY - this.lastPointerY);

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // 1. DYNAMIC 360 BACKGROUND PANNING:
      // Turning the watch physically pans the background sky spheres and environment lighting
      const sensitivity = 0.0075;
      const rotY = deltaX * sensitivity;

      this.watchGroup.rotation.y += rotY;
      this.bgSphere1.rotation.y += rotY;
      this.bgSphere2.rotation.y += rotY;

      if (this.scene.environmentRotation) {
        this.scene.environmentRotation.y += rotY;
      }

      // Gyroscope tilt on X
      this.watchGroup.rotation.x = Math.max(-0.25, Math.min(0.25, this.watchGroup.rotation.x + deltaY * 0.0025));

      // 2. ACCUMULATE ROTATION TRACKER:
      this.accumulatedRotation += Math.abs(rotY);

      // 1 single full rotation (Math.PI * 2 radians / 360deg) immediately transitions to next variant
      if (this.accumulatedRotation >= Math.PI * 2 && !this.isMorphing) {
        this.accumulatedRotation = 0;
        this.triggerZoomMorphSequence();
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.isMorphing) return;

      // Tap / Click under 5px total movement: triggers camera zoom into mountain detail
      const totalMovement = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);
      if (totalMovement < 5 && this.dragDistance < 5) {
        this.toggleFocusZoom();
      }
    });

    window.addEventListener('pointercancel', () => {
      this.isDragging = false;
    });
  }

  // ─── 8. INTERACTION 1: TOUCH / CLICK TO FOCUS ZOOM ────────────
  toggleFocusZoom(forceState = null) {
    if (this.isMorphing) return;

    this.isZoomed = forceState !== null ? forceState : !this.isZoomed;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    // Position camera/watch target at center-right (watchGroup.position.x = 0.22 on desktop)
    // so the zoomed watch dial is framed cleanly between the left title and right ORIGIN card
    // without touching the bottom variant pill bar.
    const targetFOV = this.isZoomed ? 25 : 45;
    const targetZ = this.isZoomed ? 5.2 : 12;
    const targetY = this.isZoomed ? 0.18 : 0;
    const targetModelX = this.isZoomed ? (isMobile ? 0 : 0.22) : 0;

    gsap.to(this.camera, {
      fov: targetFOV,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.updateProjectionMatrix(),
    });

    gsap.to(this.camera.position, {
      z: targetZ,
      y: targetY,
      duration: 1.1,
      ease: 'power3.inOut',
    });

    if (this.watchGroup) {
      gsap.to(this.watchGroup.position, {
        x: targetModelX,
        duration: 1.1,
        ease: 'power3.inOut',
      });
    }

    // Fade editorial narrative badge
    const badge = document.getElementById('editorial-narrative-badge');
    if (badge) {
      if (this.isZoomed) {
        badge.classList.add('visible');
        gsap.to(badge, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        });
      } else {
        gsap.to(badge, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => badge.classList.remove('visible'),
        });
      }
    }

    const zoomBtn = document.getElementById('btn-zoom-toggle');
    if (zoomBtn) {
      zoomBtn.classList.toggle('active', this.isZoomed);
      const label = zoomBtn.querySelector('.btn-label');
      if (label) {
        label.textContent = this.isZoomed ? 'ZOOM OUT' : 'INSPECT (ZOOM)';
      }
    }
  }

  // ─── 9. INTERACTION 2: 360° DRAG ZOOM-MORPH-ZOOM SEQUENCE ──────
  triggerZoomMorphSequence() {
    if (this.isMorphing) return;
    this.isMorphing = true;
    this.accumulatedRotation = 0;

    console.log('[HimalayanHero3D] 360° completed! Triggering client Zoom Out -> Morph -> Zoom In sequence.');

    const indicator = document.getElementById('rotation-indicator');
    if (indicator) indicator.classList.add('cycle-active');

    // Align watch and background spheres smoothly to front
    gsap.to(this.watchGroup.rotation, { y: 0, x: 0, duration: 0.4, ease: 'power2.out' });
    gsap.to(this.bgSphere1.rotation, { y: 0, duration: 0.4, ease: 'power2.out' });
    gsap.to(this.bgSphere2.rotation, { y: 0, duration: 0.4, ease: 'power2.out' });
    if (this.scene.environmentRotation) {
      gsap.to(this.scene.environmentRotation, { y: 0, duration: 0.4 });
    }

    const nextIndex = (this.currentVariantIndex + 1) % VARIANTS.length;

    const masterTimeline = gsap.timeline({
      onComplete: () => {
        this.isMorphing = false;
        this.isZoomed = true;
        this.accumulatedRotation = 0;
        if (indicator) indicator.classList.remove('cycle-active');
      },
    });

    // Step 1: Camera smoothly pulls back out to wide landscape view
    masterTimeline.to(this.camera, {
      fov: 45,
      duration: 0.6,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.updateProjectionMatrix(),
    }, 0);

    masterTimeline.to(this.camera.position, {
      z: 12,
      y: 0,
      duration: 0.6,
      ease: 'power3.inOut',
    }, 0);

    if (this.watchGroup) {
      masterTimeline.to(this.watchGroup.position, {
        x: 0,
        duration: 0.6,
        ease: 'power3.inOut',
      }, 0);
    }

    // Fade out badge briefly during transition
    const badge = document.getElementById('editorial-narrative-badge');
    if (badge) {
      masterTimeline.to(badge, { opacity: 0, y: 15, duration: 0.3 }, 0);
    }

    // Step 2: Dual Crossfade Sequence (1.2s ease)
    masterTimeline.add(() => {
      this.crossfadeToVariant(nextIndex, 1.2);
    }, 0.5);

    // Step 3: Camera automatically glides forward into the new feature detail
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const targetModelX = isMobile ? 0 : 0.22;

    masterTimeline.to(this.camera, {
      fov: 25,
      duration: 0.8,
      ease: 'power3.inOut',
      onUpdate: () => this.camera.updateProjectionMatrix(),
    }, 1.6);

    masterTimeline.to(this.camera.position, {
      z: 5.2,
      y: 0.18,
      duration: 0.8,
      ease: 'power3.inOut',
    }, 1.6);

    if (this.watchGroup) {
      masterTimeline.to(this.watchGroup.position, {
        x: targetModelX,
        duration: 0.8,
        ease: 'power3.inOut',
      }, 1.6);
    }

    // Fade in new narrative badge
    if (badge) {
      masterTimeline.to(badge, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        onStart: () => badge.classList.add('visible'),
      }, 2.0);
    }
  }

  // ─── 9B. VARIANT PILL CLICK: 360° SPIN TRANSITION ─────────────
  spinToVariant(targetIndex) {
    if (this.isMorphing || targetIndex === this.currentVariantIndex) return;
    this.isMorphing = true;
    this.accumulatedRotation = 0;

    const rotTargets = [this.watchGroup.rotation, this.bgSphere1.rotation, this.bgSphere2.rotation];
    if (this.scene.environmentRotation) {
      rotTargets.push(this.scene.environmentRotation);
    }

    // Rotate 3D panorama environment and watch model by exactly 1 full turn (+= Math.PI * 2)
    gsap.to(rotTargets, {
      y: `+=${Math.PI * 2}`,
      duration: 1.1,
      ease: 'expo.inOut',
    });

    // Swapping the active watch variant, EXR environment, and typography at the midpoint (0.55s)
    gsap.delayedCall(0.55, () => {
      this.crossfadeToVariant(targetIndex, 0.55);
    });

    gsap.delayedCall(1.1, () => {
      this.isMorphing = false;
      this.accumulatedRotation = 0;
    });
  }

  // ─── 10. DUAL CROSSFADE ENGINE (PNG SPHERES + EXR + PBR MESH) ──
  crossfadeToVariant(targetIndex, duration = 1.2) {
    const nextVar = VARIANTS[targetIndex];
    this.currentVariantIndex = targetIndex;

    // 1. Crossfade visual sphere textures
    const nextTexture = this.bgTextures[nextVar.id];
    if (nextTexture) {
      this.skyMat2.map = nextTexture;
      this.skyMat2.opacity = 0;
      this.skyMat2.needsUpdate = true;

      gsap.to(this.skyMat2, {
        opacity: 1,
        duration: duration,
        ease: 'power2.inOut',
        onComplete: () => {
          this.skyMat1.map = nextTexture;
          this.skyMat1.opacity = 1;
          this.skyMat1.needsUpdate = true;
          this.skyMat2.opacity = 0;
          this.skyMat2.needsUpdate = true;
        },
      });
    }

    // 2. Interpolate scene.environment to new matching EXR lighting
    const nextEnvMap = this.envMaps[nextVar.id];
    if (nextEnvMap) {
      this.scene.environment = nextEnvMap;
    }

    // 3. Interpolate Watch PBR Mesh Parameters
    const targetDialColor = new THREE.Color(nextVar.dialColor);
    const targetChassisColor = new THREE.Color(nextVar.chassisColor);
    const targetBezelColor = new THREE.Color(nextVar.bezelColor);

    // Dynamic exposure & light glare reduction for Summit Ice to prevent chalky over-exposure
    const isSummitIce = nextVar.id === 'summit-ice';
    const targetKeyLight = isSummitIce ? 1.82 : 2.6; // 30% reduction on key light
    const targetFillLight = isSummitIce ? 1.05 : 1.5; // 30% reduction on fill
    const targetRimLight = isSummitIce ? 1.4 : 2.0;
    const targetExposure = isSummitIce ? 0.92 : 1.15;
    const targetEnvIntensity = isSummitIce ? 1.25 : 1.8;

    if (this.keyLight) gsap.to(this.keyLight, { intensity: targetKeyLight, duration: duration, ease: 'power2.out' });
    if (this.fillLight) gsap.to(this.fillLight, { intensity: targetFillLight, duration: duration, ease: 'power2.out' });
    if (this.rimLight) gsap.to(this.rimLight, { intensity: targetRimLight, duration: duration, ease: 'power2.out' });
    if (this.renderer) gsap.to(this.renderer, { toneMappingExposure: targetExposure, duration: duration, ease: 'power2.out' });

    this.dialMaterials.forEach((mat) => {
      // Use crisp silver-glacial tone for Summit Ice to prevent flat white wash
      mat.color.set(isSummitIce ? 0xf0f4f8 : 0xffffff);
      mat.envMapIntensity = targetEnvIntensity;
      gsap.to(mat, {
        roughness: nextVar.dialRoughness,
        metalness: nextVar.dialMetalness,
        duration: duration,
        ease: 'power2.out',
      });
    });

    this.caseMaterials.forEach((mat) => {
      gsap.to(mat.color, {
        r: targetChassisColor.r,
        g: targetChassisColor.g,
        b: targetChassisColor.b,
        duration: duration,
        ease: 'power2.out',
      });
      gsap.to(mat, {
        roughness: nextVar.chassisRoughness,
        metalness: nextVar.chassisMetalness,
        duration: duration,
        ease: 'power2.out',
      });
    });

    this.bezelMaterials.forEach((mat) => {
      gsap.to(mat.color, {
        r: targetBezelColor.r,
        g: targetBezelColor.g,
        b: targetBezelColor.b,
        duration: duration,
        ease: 'power2.out',
      });
    });

    // 4. Update UI Overlay Texts and Badges
    this.updateUIVariantContent(nextVar);
  }

  updateUIVariantContent(variant) {
    // Update active pill button
    const pills = document.querySelectorAll('.variant-pill');
    pills.forEach((pill) => {
      if (pill.dataset.variant === variant.id) {
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
      } else {
        pill.classList.remove('active');
        pill.setAttribute('aria-selected', 'false');
      }
    });

    // Animated DOM updates for narrative badge and header
    const nameEl = document.getElementById('hero-variant-name');
    const refEl = document.getElementById('hero-variant-ref');
    const badgeEyebrowEl = document.getElementById('narrative-badge-eyebrow');
    const badgeTitleEl = document.querySelector('.narrative-badge-title');
    const badgeDescEl = document.getElementById('hero-narrative-desc');
    const badgeElevEl = document.getElementById('narrative-elevation-val');

    if (nameEl) {
      gsap.to(nameEl, {
        opacity: 0,
        y: -6,
        duration: 0.2,
        onComplete: () => {
          nameEl.textContent = variant.name;
          gsap.to(nameEl, { opacity: 1, y: 0, duration: 0.3 });
        },
      });
    }

    if (badgeEyebrowEl) badgeEyebrowEl.textContent = variant.eyebrow;
    if (badgeTitleEl) badgeTitleEl.textContent = variant.title;
    if (badgeDescEl) badgeDescEl.textContent = variant.body;
    if (refEl) refEl.textContent = variant.ref;
    if (badgeElevEl) badgeElevEl.textContent = variant.elevationVal;

    // Dynamic background atmospheric color transition alongside watch model
    const heroSection = document.querySelector('.hero-3d-section');
    const heroOverlay = document.querySelector('.hero-canvas-overlay');
    const ambientProfiles = {
      'glacial-twilight': {
        sectionBg: '#111111',
        overlay: 'radial-gradient(circle at 50% 50%, transparent 35%, #111111 95%), radial-gradient(circle at 50% 45%, rgba(30, 58, 95, 0.28) 0%, transparent 65%), linear-gradient(to bottom, rgba(17, 17, 17, 0.4) 0%, transparent 40%, #111111 100%)'
      },
      'mineral-slate': {
        sectionBg: '#111111',
        overlay: 'radial-gradient(circle at 50% 50%, transparent 35%, #111111 95%), radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.08) 0%, transparent 65%), linear-gradient(to bottom, rgba(17, 17, 17, 0.4) 0%, transparent 40%, #111111 100%)'
      },
      'summit-ice': {
        sectionBg: '#111111',
        overlay: 'radial-gradient(circle at 50% 50%, transparent 35%, #111111 95%), radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.08) 0%, transparent 65%), linear-gradient(to bottom, rgba(17, 17, 17, 0.4) 0%, transparent 40%, #111111 100%)'
      },
      'alpine-pine': {
        sectionBg: '#111111',
        overlay: 'radial-gradient(circle at 50% 50%, transparent 35%, #111111 95%), radial-gradient(circle at 50% 45%, rgba(15, 91, 76, 0.22) 0%, transparent 65%), linear-gradient(to bottom, rgba(17, 17, 17, 0.4) 0%, transparent 40%, #111111 100%)'
      }
    };
    const prof = ambientProfiles[variant.id] || ambientProfiles['glacial-twilight'];
    if (heroSection) heroSection.style.backgroundColor = prof.sectionBg;
    if (heroOverlay) heroOverlay.style.background = prof.overlay;
  }

  // ─── 11. UI EVENT BINDINGS ────────────────────────────────────
  setupUIBindings() {
    const pills = document.querySelectorAll('.variant-pill');
    pills.forEach((pill, idx) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isMorphing) return;
        this.spinToVariant(idx);
      });
    });

    const zoomBtn = document.getElementById('btn-zoom-toggle');
    if (zoomBtn) {
      zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFocusZoom();
      });
    }

    const narrativeCloseBtn = document.getElementById('narrative-close-btn');
    if (narrativeCloseBtn) {
      narrativeCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isZoomed) {
          this.toggleFocusZoom(false);
        }
      });
    }
  }

  // ─── 12. ANIMATION / RENDER LOOP ──────────────────────────────
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Visibility Culling: Pause expensive WebGL render when hero is scrolled out of viewport
    if (!this.isVisible) return;

    // Subtle breathing ambient spin when idle
    if (!this.isDragging && !this.isMorphing && this.watchGroup) {
      const idleRot = 0.001;
      this.watchGroup.rotation.y += idleRot;
      this.bgSphere1.rotation.y += idleRot;
      this.bgSphere2.rotation.y += idleRot;
      if (this.scene.environmentRotation) {
        this.scene.environmentRotation.y += idleRot;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ─── AUTO-INIT ON DOM READY ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    window.gtcHero3D = new HimalayanHero3D('#hero-canvas');
  }
});
