import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitText(el, mode) {
  const text = (el.textContent || "").trim();
  if (!text) return;

  const parts =
    mode === "letters"
      ? Array.from(text)
      : text
          .split(/\s+/g)
          .filter(Boolean)
          .flatMap((w, i, arr) => (i < arr.length - 1 ? [w, " "] : [w]));

  el.textContent = "";
  el.classList.add("split");

  for (const part of parts) {
    if (part === " ") {
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const span = document.createElement("span");
    span.textContent = part;
    el.appendChild(span);
  }
}

function initSplit() {
  const nodes = document.querySelectorAll("[data-split]");
  for (const node of nodes) {
    const mode = node.getAttribute("data-split");
    splitText(node, mode);
  }

  const preloadTitle = document.querySelector(".preloader-title");
  if (preloadTitle && !preloadTitle.getAttribute("data-text")) {
    preloadTitle.setAttribute("data-text", (preloadTitle.textContent || "").trim());
  }
}

function initCursor() {
  if (prefersReducedMotion) return;

  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  document.body.classList.add("cursor-ready");

  const onMove = (e) => {
    tx = e.clientX;
    ty = e.clientY;
  };

  window.addEventListener("mousemove", onMove, { passive: true });

  const hotSelector = "[data-cursor='hot']";

  const onOver = (e) => {
    const target = e.target instanceof Element ? e.target.closest(hotSelector) : null;
    if (target) document.body.classList.add("cursor-hot");
  };
  const onOut = (e) => {
    const target = e.target instanceof Element ? e.target.closest(hotSelector) : null;
    if (target) document.body.classList.remove("cursor-hot");
  };

  document.addEventListener("mouseover", onOver, { passive: true });
  document.addEventListener("mouseout", onOut, { passive: true });

  const tick = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0) scale(1)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initLenisAndScroll() {
  if (prefersReducedMotion) return null;

  const lenis = new window.Lenis({
    lerp: 0.095,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: 1.6,
  });

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    lenis.on("scroll", window.ScrollTrigger.update);
  }

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  return lenis;
}

function initGSAP(sceneCtx) {
  if (!window.gsap) return;

  const gsap = window.gsap;

  gsap.set("[data-reveal='fade']", { opacity: 0, y: 18 });

  const preloader = document.getElementById("preloader");
  const preTitle = document.querySelector(".preloader-title");
  const preSub = document.querySelector(".preloader-sub");

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (preTitle) {
    const spans = preTitle.querySelectorAll("span");
    gsap.set(spans, { opacity: 0, y: 24, rotateX: -70, transformOrigin: "50% 80%" });
    tl.to(spans, { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.02 }, 0.1);
  }

  if (preSub) {
    tl.fromTo(preSub, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.55);
  }

  tl.to({}, { duration: 0.4 });

  if (preloader) {
    tl.to(preloader, { opacity: 0, duration: 0.65 }, "+=0.2").set(preloader, { display: "none" });
  }

  const heroTitle = document.querySelector(".hero-title");
  const heroTagline = document.querySelector(".hero-tagline");

  if (heroTitle) {
    const spans = heroTitle.querySelectorAll("span");
    gsap.set(spans, { opacity: 0, y: 50, rotateX: -80, transformOrigin: "50% 100%" });
    tl.to(spans, { opacity: 1, y: 0, rotateX: 0, duration: 0.95, stagger: 0.018 }, "-=0.15");
  }

  if (heroTagline) {
    const spans = heroTagline.querySelectorAll("span");
    gsap.set(spans, { opacity: 0, y: 18 });
    tl.to(spans, { opacity: 1, y: 0, duration: 0.55, stagger: 0.035 }, "-=0.6");
  }

  tl.to(".hero [data-reveal='fade']", { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.5");

  if (window.ScrollTrigger) {
    gsap.utils.toArray("[data-reveal='fade']").forEach((node) => {
      if (node.closest(".hero")) return;
      gsap.fromTo(
        node,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 88%" },
        },
      );
    });

    gsap.utils.toArray(".card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 42, rotateX: -10 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.9,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 86%",
          },
        },
      );
    });

    gsap.utils.toArray("[data-split='words']").forEach((node) => {
      if (node.closest("#preloader")) return;
      if (node.closest(".hero")) return;
      const spans = node.querySelectorAll("span");
      gsap.fromTo(
        spans,
        { opacity: 0, y: 22, rotateX: -70, transformOrigin: "50% 90%" },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.9,
          stagger: 0.03,
          ease: "power3.out",
          scrollTrigger: {
            trigger: node,
            start: "top 85%",
          },
        },
      );
    });

    if (sceneCtx?.rig) {
      const rig = sceneCtx.rig;

      if (!prefersReducedMotion) {
        const hud = document.getElementById("chaptersHud");
        const hudSteps = hud ? Array.from(hud.querySelectorAll(".chaptersHud-step")) : [];
        const setHudActive = (idx) => {
          if (!hudSteps.length) return;
          for (let i = 0; i < hudSteps.length; i += 1) {
            hudSteps[i].classList.toggle("is-active", i === idx);
          }
        };

        const chapters = gsap.timeline({
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "+=240%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: () => {
              if (hud) document.body.classList.add("chapters-on");
            },
            onEnterBack: () => {
              if (hud) document.body.classList.add("chapters-on");
            },
            onLeave: () => {
              if (hud) document.body.classList.remove("chapters-on");
            },
            onLeaveBack: () => {
              if (hud) document.body.classList.remove("chapters-on");
            },
            onUpdate: (self) => {
              if (!hudSteps.length) return;
              const p = self.progress;
              const idx = Math.min(2, Math.floor(p * 3));
              setHudActive(idx);
            },
          },
          defaults: { ease: "none" },
        });

        chapters
          .to(
            rig,
            {
              scroll: 0.65,
              x: 0.25,
              y: -0.22,
              z: 15.25,
              lookX: 0,
              lookY: -0.08,
              lookZ: 0,
              fireIntensity: 0.56,
              emberIntensity: 1.08,
              topoOpacity: 0.075,
              topoLift: 0.2,
              topoTilt: 0.04,
              warm: 0.04,
              bloomStrength: 0.34,
              bloomRadius: 0.26,
              bloomThreshold: 0.72,
            },
            0,
          )
          .to(
            rig,
            {
              scroll: 1.05,
              x: -0.85,
              y: 0.28,
              z: 14.35,
              lookX: 0.18,
              lookY: -0.42,
              lookZ: 0,
              fireIntensity: 0.62,
              emberIntensity: 1.14,
              topoOpacity: 0.12,
              topoLift: 0.85,
              topoTilt: 0.12,
              warm: 0.055,
              bloomStrength: 0.52,
              bloomRadius: 0.34,
              bloomThreshold: 0.66,
            },
            0.36,
          )
          .to(rig, { shake: 0.7, duration: 0.035 }, 0.52)
          .to(rig, { shake: 0.0, duration: 0.09 }, 0.56)
          .to(
            rig,
            {
              scroll: 1.35,
              x: 1.15,
              y: -0.55,
              z: 14.4,
              lookX: 0,
              lookY: -0.35,
              lookZ: 0,
              fireIntensity: 0.5,
              emberIntensity: 1.1,
              topoOpacity: 0.095,
              topoLift: 0.55,
              topoTilt: 0.06,
              warm: 0.06,
              bloomStrength: 0.42,
              bloomRadius: 0.3,
              bloomThreshold: 0.7,
            },
            0.72,
          );
      }

      gsap.to(rig, {
        scroll: 2,
        scrollTrigger: {
          trigger: "#arsenal",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(rig, {
        scroll: 3,
        scrollTrigger: {
          trigger: "#contact",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(rig, {
        x: 1.15,
        y: -0.55,
        z: 14.4,
        lookX: 0,
        lookY: -0.35,
        lookZ: 0,
        fireIntensity: 0.48,
        emberIntensity: 1.08,
        topoOpacity: 0.085,
        topoLift: 0.55,
        topoTilt: 0.06,
        warm: 0.06,
        bloomStrength: 0.42,
        bloomRadius: 0.3,
        bloomThreshold: 0.7,
        scrollTrigger: {
          trigger: "#arsenal",
          start: "top 92%",
          end: "top 34%",
          scrub: true,
        },
      });

      gsap.to(rig, {
        x: -1.05,
        y: 0.95,
        z: 13.4,
        lookX: 0.15,
        lookY: 0.15,
        lookZ: 0,
        fireIntensity: 0.62,
        emberIntensity: 1.18,
        topoOpacity: 0.1,
        topoLift: 1.05,
        topoTilt: 0.14,
        warm: 0.085,
        bloomStrength: 0.58,
        bloomRadius: 0.36,
        bloomThreshold: 0.64,
        scrollTrigger: {
          trigger: "#contact",
          start: "top 92%",
          end: "top 34%",
          scrub: true,
        },
      });
    }
  }
}

function initTiltCards() {
  const cards = document.querySelectorAll(".card");
  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const rx = (py - 0.5) * -10;
      const ry = (px - 0.5) * 12;

      card.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    };

    const onLeave = () => {
      card.style.transform = "";
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
  }
}

function initEmbers() {
  const canvas = document.getElementById("bg");
  if (!(canvas instanceof HTMLCanvasElement)) return { destroy: () => {} };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  camera.position.set(0, 0, 16);

  const rig = {
    x: 0,
    y: 0,
    z: 16,
    lookX: 0,
    lookY: 0,
    lookZ: 0,
    fireIntensity: 0.38,
    emberIntensity: 1.0,
    topoOpacity: 0.06,
    topoLift: 0,
    topoTilt: 0,
    warm: 0.02,
    bloomStrength: 0.32,
    bloomRadius: 0.26,
    bloomThreshold: 0.72,
    shake: 0,
    scroll: 0,
  };

  const resolution = new THREE.Vector2(1, 1);
  const mouse = new THREE.Vector2(0.5, 0.5);

  const fireMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: rig.fireIntensity },
      uScroll: { value: 0 },
      uResolution: { value: resolution },
      uMouse: { value: mouse },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uScroll;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.55;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.02;
          a *= 0.52;
        }
        return v;
      }

      vec3 flamePalette(float t) {
        vec3 c1 = vec3(0.75, 0.12, 0.10);
        vec3 c2 = vec3(0.92, 0.30, 0.16);
        vec3 c3 = vec3(0.96, 0.58, 0.16);
        vec3 c4 = vec3(0.98, 0.78, 0.12);
        return mix(mix(c1, c2, smoothstep(0.0, 0.35, t)), mix(c3, c4, smoothstep(0.35, 1.0, t)), smoothstep(0.25, 1.0, t));
      }

      void main() {
        vec2 uv = vUv;
        vec2 asp = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
        vec2 p = (uv - 0.5) * asp;

        float t = uTime;
        float scroll = uScroll * 0.35;

        float drift = (uMouse.x - 0.5) * 0.18;
        uv.x += drift;

        vec2 q = vec2(uv.x * 1.25, uv.y * 1.15);
        q.y += t * 0.12 + scroll;

        float n1 = fbm(q * 2.0 + vec2(0.0, t * 0.05));
        float n2 = fbm(q * 3.6 + vec2(1.7, -t * 0.07));
        float flow = n1 * 0.65 + n2 * 0.35;

        float center = 1.0 - smoothstep(0.0, 0.75, abs(p.x));
        float rise = smoothstep(0.0, 1.0, uv.y);
        float flame = smoothstep(0.24, 0.92, flow + center * 0.55 - (1.0 - rise) * 0.45);
        float flicker = 0.65 + 0.35 * sin(t * 4.2 + flow * 7.0);

        float alpha = flame * center * rise;
        alpha *= flicker;
        alpha *= uIntensity;
        alpha *= 0.55;

        vec3 col = flamePalette(clamp(flow + center * 0.35, 0.0, 1.0));
        col *= 0.65 + 0.35 * rise;
        col *= 0.9;

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const firePlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 1, 1), fireMaterial);
  firePlane.position.set(0, 0, -18);
  firePlane.renderOrder = 0;
  scene.add(firePlane);

  const topoGeo = new THREE.PlaneGeometry(52, 28, 80, 40);
  const topoMat = new THREE.MeshBasicMaterial({
    color: 0xf39c12,
    wireframe: true,
    transparent: true,
    opacity: rig.topoOpacity,
  });
  const topo = new THREE.Mesh(topoGeo, topoMat);
  const topoBaseRotX = -0.98;
  const topoBaseY = -6.2;
  topo.rotation.x = topoBaseRotX;
  topo.position.set(0, topoBaseY, -14.5);
  topo.renderOrder = 1;
  scene.add(topo);

  const topoPos = topoGeo.attributes.position;
  const topoBase = new Float32Array(topoPos.array);

  const createEmberTexture = () => {
    const size = 96;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(241,196,15,0.95)");
    g.addColorStop(0.25, "rgba(243,156,18,0.65)");
    g.addColorStop(0.55, "rgba(231,76,60,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const texture = createEmberTexture();

  const count = prefersReducedMotion ? 240 : 1400;
  const radius = 18;
  const height = 22;

  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * height;
    positions[i3 + 2] = (Math.random() - 0.5) * radius;
    speeds[i] = 0.12 + Math.random() * 0.55;
    scales[i] = 0.35 + Math.random() * 1.15;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTex: { value: texture },
      uIntensity: { value: rig.emberIntensity },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aScale;
      attribute float aPhase;
      varying float vAlpha;
      varying vec2 vUv;
      void main() {
        vec3 p = position;
        float t = uTime * 0.35;
        p.x += sin(t + aPhase + position.y * 0.22) * 0.35;
        p.z += cos(t + aPhase + position.x * 0.18) * 0.32;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = clamp(1.0 - (abs(p.y) / 12.0), 0.0, 1.0);
        vAlpha = dist;
        gl_PointSize = (9.0 * aScale) * (1.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      uniform float uIntensity;
      varying float vAlpha;
      void main() {
        vec4 col = texture2D(uTex, gl_PointCoord);
        float a = col.a * vAlpha * uIntensity;
        gl_FragColor = vec4(col.rgb, a);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = 2;
  scene.add(points);

  const warm = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
      transparent: true,
      opacity: rig.warm,
    }),
  );
  warm.position.z = -18;
  warm.renderOrder = 3;
  scene.add(warm);

  let composer = null;
  let bloomPass = null;

  if (!prefersReducedMotion) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), rig.bloomStrength, rig.bloomRadius, rig.bloomThreshold);
    bloomPass.strength = rig.bloomStrength;
    bloomPass.radius = rig.bloomRadius;
    bloomPass.threshold = rig.bloomThreshold;
    composer.addPass(bloomPass);
  }

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resolution.set(w * Math.min(window.devicePixelRatio || 1, 2), h * Math.min(window.devicePixelRatio || 1, 2));
    composer?.setSize(w, h);
    bloomPass?.setSize(w, h);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let rafId = 0;
  let last = performance.now();
  let mouseX = 0;
  let mouseY = 0;

  const onMove = (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const animate = (now) => {
    const dt = Math.min(0.06, (now - last) / 1000);
    last = now;

    const t = now / 1000;
    material.uniforms.uTime.value = t;
    material.uniforms.uIntensity.value = rig.emberIntensity;
    fireMaterial.uniforms.uTime.value = t;
    fireMaterial.uniforms.uIntensity.value = rig.fireIntensity;
    fireMaterial.uniforms.uScroll.value = rig.scroll;
    topoMat.opacity = rig.topoOpacity;
    warm.material.opacity = rig.warm;
    if (bloomPass) {
      bloomPass.strength = rig.bloomStrength;
      bloomPass.radius = rig.bloomRadius;
      bloomPass.threshold = rig.bloomThreshold;
    }

    topo.position.y = topoBaseY + rig.topoLift;
    topo.rotation.x = topoBaseRotX + rig.topoTilt;

    topo.rotation.z = Math.sin(t * 0.22) * 0.06;
    for (let i = 0; i < topoPos.count; i += 1) {
      const i3 = i * 3;
      const bx = topoBase[i3 + 0];
      const by = topoBase[i3 + 1];
      const wave =
        Math.sin(bx * 0.32 + t * 0.9 + rig.scroll * 0.8) * 0.45 +
        Math.cos(by * 0.38 + t * 0.65 + rig.scroll * 0.55) * 0.35;
      topoPos.array[i3 + 2] = topoBase[i3 + 2] + wave * 0.55;
    }
    topoPos.needsUpdate = true;

    const pos = geometry.attributes.position;
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      pos.array[i3 + 1] += speeds[i] * dt;
      pos.array[i3 + 0] += Math.sin(phases[i] + now * 0.0006) * dt * 0.06;
      pos.array[i3 + 2] += Math.cos(phases[i] + now * 0.00055) * dt * 0.05;
      if (pos.array[i3 + 1] > height * 0.5) {
        pos.array[i3 + 1] = -height * 0.5;
        pos.array[i3 + 0] = (Math.random() - 0.5) * radius;
        pos.array[i3 + 2] = (Math.random() - 0.5) * radius;
        speeds[i] = 0.12 + Math.random() * 0.55;
      }
    }
    pos.needsUpdate = true;

    const tx = rig.x + mouseX * 1.0;
    const ty = rig.y + -mouseY * 0.65;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.position.z += (rig.z - camera.position.z) * 0.03;
    const shake = rig.shake;
    if (shake > 0.0001) {
      const s = shake * 0.085;
      const sx = (Math.sin(t * 18.3) + Math.sin(t * 29.7)) * 0.5 * s;
      const sy = (Math.cos(t * 21.2) + Math.sin(t * 31.4)) * 0.5 * s * 0.75;
      camera.position.x += sx;
      camera.position.y += sy;
      camera.lookAt(rig.lookX + sx * 0.12, rig.lookY + sy * 0.12, rig.lookZ);
    } else {
      camera.lookAt(rig.lookX, rig.lookY, rig.lookZ);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);

  const onVis = () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else {
      last = performance.now();
      rafId = requestAnimationFrame(animate);
    }
  };
  document.addEventListener("visibilitychange", onVis);

  const destroy = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVis);
    geometry.dispose();
    material.dispose();
    if (texture) texture.dispose();
    topoGeo.dispose();
    topoMat.dispose();
    firePlane.geometry.dispose();
    fireMaterial.dispose();
    composer?.dispose?.();
    renderer.dispose();
  };

  return { destroy, rig };
}

initSplit();
const sceneCtx = initEmbers();
initCursor();
initLenisAndScroll();
initTiltCards();
initGSAP(sceneCtx);

window.addEventListener("beforeunload", () => {
  sceneCtx?.destroy?.();
});
