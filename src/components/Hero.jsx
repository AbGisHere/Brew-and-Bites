import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Stars, Environment } from '@react-three/drei'
import { motion, useScroll, useTransform } from 'motion/react'
import { useTheme } from '../context/ThemeContext'

// ── Roast levels 0 (light) → 6 (french) ──────────────────────────────────────
const ROAST_COLORS = [
  '#d9934c', // 0  light roast — warm bright tan
  '#c07830', // 1  medium-light
  '#ab6525', // 2  medium
  '#8B5A2B', // 3  medium (standard)
  '#7a4220', // 4  medium-dark
  '#5c2a12', // 5  dark
  '#3a1508', // 6  very dark / french roast
]

// ── Shape variants: [widthRatio, depthRatio] — Y is always 1.0 (long axis) ───
const SHAPES = [
  [0.64, 0.47], // standard
  [0.59, 0.42], // slim / elongated
  [0.72, 0.56], // rounder / plump
  [0.61, 0.39], // very flat
  [0.68, 0.51], // medium-round
]

// ── Material finishes ─────────────────────────────────────────────────────────
const MATS = [
  { roughness: 0.62, clearcoat: 0.50, ccRough: 0.52 }, // fresh / oily sheen
  { roughness: 0.80, clearcoat: 0.20, ccRough: 0.78 }, // standard
  { roughness: 0.95, clearcoat: 0.03, ccRough: 0.97 }, // matte / aged
]

// ── Shader modifier — applied once at module level, shared across all beans ──
// Adds: (1) a crease groove along the long axis, (2) two-octave grain noise.
function addBeanShader(shader) {
  // Pass object-space position from vertex → fragment
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vBeanPos;'
    )
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvBeanPos = position;'
    )

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vBeanPos;'
    )
    .replace(
      // Hook in right after diffuseColor is declared
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4( diffuse, opacity );

      // ── Crease groove ──────────────────────────────────────────────────────
      // The bean's long axis is Y.  The crease runs along Y at X ≈ 0.
      // Sphere base radius is 0.30, so normalise by it.
      float xAbs      = abs(vBeanPos.x) / 0.30;
      // Fade the crease at the pointed tips (|y| → bR)
      float tipFade   = 1.0 - smoothstep(0.68, 0.96, abs(vBeanPos.y) / 0.30);
      float crease    = smoothstep(0.09, 0.0, xAbs) * 0.72 * tipFade;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.06, crease);

      // ── Grain / surface irregularity ───────────────────────────────────────
      // Two-octave hash noise — coarse (scale×14) + fine (scale×38)
      vec3 p1 = vBeanPos * 14.0;
      float n1 = fract(sin(dot(p1, vec3(127.1, 311.7,  74.3))) * 43758.5453) * 0.10 - 0.05;
      vec3 p2 = vBeanPos * 38.0;
      float n2 = fract(sin(dot(p2, vec3(269.5, 183.3, 246.1))) * 12345.6789) * 0.06 - 0.03;
      diffuseColor.rgb = clamp(diffuseColor.rgb + n1 + n2, 0.0, 1.0);`
    )
}

// ─── CoffeeBean ───────────────────────────────────────────────────────────────
function CoffeeBean({
  position, speed = 1.0, beanScale = 1.0, isDark,
  roastLevel = 3, shapeIdx = 0, matIdx = 0,
  initialRotation = [0, 0, 0],
}) {
  const groupRef  = useRef()
  const elapsed   = useRef(0) // avoids THREE.Clock.getElapsedTime()
  const initPos   = useMemo(() => [position[0], position[1], position[2]], [])

  const color      = ROAST_COLORS[roastLevel % ROAST_COLORS.length]
  const [sw, sd]   = SHAPES[shapeIdx % SHAPES.length]
  const mat        = MATS[matIdx % MATS.length]
  const s          = beanScale
  const bR         = 0.30

  const rotDir = shapeIdx % 2 === 0 ? 1 : -1
  const phase  = initPos[0] * 1.9 + initPos[2] * 0.7

  // delta-based time — no THREE.Clock calls from our code
  useFrame((_, delta) => {
    if (!groupRef.current) return
    elapsed.current += delta
    const t = elapsed.current
    groupRef.current.position.y = initPos[1] + Math.sin(t * speed + phase) * 0.42
    groupRef.current.position.x = initPos[0] + Math.cos(t * speed * 0.52 + initPos[2]) * 0.15
    groupRef.current.rotation.x += 0.0025 * speed
    groupRef.current.rotation.y += 0.0034 * speed * rotDir
    groupRef.current.rotation.z += 0.0016 * speed * rotDir
  })

  const emissiveInt = isDark
    ? (roastLevel <= 2 ? 0.22 : 0.11)
    : (roastLevel <= 2 ? 0.09 : 0.02)

  return (
    <group ref={groupRef} position={position} rotation={initialRotation}>
      <mesh scale={[sw * s, 1.0 * s, sd * s]}>
        <sphereGeometry args={[bR, 24, 18]} />
        <meshPhysicalMaterial
          color={color}
          roughness={mat.roughness}
          metalness={0.0}
          clearcoat={mat.clearcoat}
          clearcoatRoughness={mat.ccRough}
          emissive={color}
          emissiveIntensity={emissiveInt}
          onBeforeCompile={addBeanShader}
        />
      </mesh>
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ mouseX, mouseY, isDark }) {
  const sceneRef = useRef()

  useFrame(() => {
    if (!sceneRef.current) return
    sceneRef.current.rotation.y += (mouseX  *  0.10 - sceneRef.current.rotation.y) * 0.03
    sceneRef.current.rotation.x += (-mouseY * 0.06  - sceneRef.current.rotation.x) * 0.03
  })

  const beans = useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 7 - 0.5,
      ],
      speed:           0.14 + Math.random() * 0.42,
      beanScale:       0.45 + Math.random() * 1.40,
      roastLevel:      Math.floor(Math.random() * 7),
      shapeIdx:        i % SHAPES.length,
      matIdx:          Math.floor(Math.random() * MATS.length),
      initialRotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ],
    }))
  , [])

  return (
    <>
      <ambientLight intensity={isDark ? 0.18 : 0.75} color={isDark ? '#D4A76A' : '#FFF3E0'} />
      <pointLight position={[ 5,  5,  5]} intensity={isDark ? 3.5 : 2.0} color="#D4A76A" />
      <pointLight position={[-6,  3,  3]} intensity={isDark ? 2.0 : 1.1} color="#FF8C42" />
      <pointLight position={[ 0, -5,  2]} intensity={isDark ? 1.1 : 0.4} color="#8B5A2B" />
      <pointLight position={[ 2,  3,  7]} intensity={isDark ? 1.6 : 0.8} color="#FFB347" />
      <pointLight position={[-4, -2,  4]} intensity={isDark ? 0.9 : 0.3} color="#D4A76A" />
      <Environment preset={isDark ? 'sunset' : 'dawn'} background={false} />
      <group ref={sceneRef}>
        {isDark && (
          <Stars radius={55} depth={35} count={360} factor={2} saturation={0} fade speed={0.28} />
        )}
        {/* Dark mode: warm gold dust — Light mode: dark coffee-brown dust (needs contrast vs cream) */}
        <Sparkles
          count={isDark ? 60 : 90}
          scale={[18, 12, 8]}
          size={isDark ? 1.6 : 2.2}
          speed={0.14}
          color={isDark ? '#D4A76A' : '#4a1e08'}
          opacity={isDark ? 0.28 : 0.60}
        />
        {beans.map((bean, i) => (
          <CoffeeBean key={i} isDark={isDark} {...bean} />
        ))}
      </group>
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero({ onAdminLogin, onWaiterLogin }) {
  const { isDark } = useTheme()
  const [mouse, setMouse]     = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  // Use plain window scroll — avoids motion warning about container position.
  // Hero is h-screen (100vh), so scrollY 0→innerHeight covers start→end of section.
  const { scrollY } = useScroll()
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const textY       = useTransform(scrollY, [0, vh],        [0, -100])
  const textOpacity = useTransform(scrollY, [0, vh * 0.75], [1, 0])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handle = (e) => setMouse({
      x: (e.clientX / window.innerWidth  - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  const bg = isDark
    ? 'linear-gradient(135deg, #0a0605 0%, #120804 50%, #0d0806 100%)'
    : 'linear-gradient(135deg, #F5E6D0 0%, #EDD9BD 40%, #F0DCC8 100%)'
  const fadeBottom = isDark ? '#0a0605' : '#F5E6D0'
  const goldGrad = isDark
    ? 'linear-gradient(135deg, #D4A76A, #FF8C42)'
    : 'linear-gradient(135deg, #8B5A2B, #D4A76A)'

  return (
    <section id="home" className="relative h-screen overflow-hidden" style={{ background: bg }}>
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Scene mouseX={mouse.x} mouseY={mouse.y} isDark={isDark} />
          </Suspense>
        </Canvas>
      </div>

      {/* Left radial glow behind text */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? 'radial-gradient(ellipse 55% 70% at 25% 50%, rgba(10,3,0,0.75) 0%, transparent 70%)'
          : 'radial-gradient(ellipse 55% 70% at 25% 50%, rgba(245,230,208,0.85) 0%, transparent 70%)',
      }} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${fadeBottom})` }} />

      {/* Text block — scroll parallax */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24"
        style={{ y: textY, opacity: textOpacity, maxWidth: '680px' }}
      >
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={mounted ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="h-px w-10" style={{ background: isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)' }} />
          <span className="text-xs tracking-[0.45em] uppercase font-semibold" style={{ color: isDark ? '#D4A76A' : '#8B5A2B' }}>
            Specialty Coffee &amp; Kitchen · Est. 2015
          </span>
        </motion.div>

        {/* Staircase title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.2 }}
          style={{ lineHeight: 0.88, marginBottom: '2.5rem' }}
        >
          <div style={{ fontSize: 'clamp(64px, 10.5vw, 144px)', fontWeight: 900, letterSpacing: '-0.03em', color: isDark ? '#F5DEB3' : '#1a0805' }}>
            BREW
          </div>
          <div style={{
            fontSize: 'clamp(30px, 5vw, 68px)', fontWeight: 300, paddingLeft: '2vw',
            letterSpacing: '0.06em',
            background: goldGrad,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            &amp;
          </div>
          <div style={{ fontSize: 'clamp(64px, 10.5vw, 144px)', fontWeight: 900, letterSpacing: '-0.03em', paddingLeft: '3.5vw', color: isDark ? '#F5DEB3' : '#1a0805' }}>
            BITES
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-lg md:text-xl mb-2 font-light"
          style={{ color: isDark ? 'rgba(245,222,179,0.6)' : 'rgba(26,8,5,0.6)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          Every cup, a ceremony.
        </motion.p>

        {/* Stats line */}
        <motion.p
          className="text-xs tracking-widest mb-10"
          style={{ color: isDark ? 'rgba(212,167,106,0.45)' : 'rgba(139,90,43,0.5)' }}
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          10K+ happy guests · 50+ menu items · 4.9★ rating
        </motion.p>

        {/* Order Now */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.52 }}
        >
          <button
            onClick={() => window.location.href = '/order'}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm tracking-[0.12em] transition-all duration-200 hover:scale-105 active:scale-95 mb-6"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #D4A76A 0%, #B9864B 60%, #8B5A2B 100%)'
                : 'linear-gradient(135deg, #8B5A2B 0%, #693319 60%, #B9864B 100%)',
              color: isDark ? '#0a0605' : '#FFF8F0',
              boxShadow: isDark
                ? '0 0 40px rgba(212,167,106,0.35), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 0 25px rgba(139,90,43,0.25), 0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            ORDER NOW
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </button>
        </motion.div>

        {/* Admin · Staff · GitHub */}
        <motion.div
          className="flex flex-wrap items-center gap-4"
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.68 }}
        >
          <button
            onClick={onAdminLogin}
            className="text-xs font-semibold tracking-[0.15em] uppercase opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: isDark ? '#D4A76A' : '#8B5A2B' }}
          >
            Admin Login
          </button>
          <span style={{ color: isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.2)' }}>·</span>
          <button
            onClick={onWaiterLogin}
            className="text-xs font-semibold tracking-[0.15em] uppercase opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: isDark ? '#D4A76A' : '#8B5A2B' }}
          >
            Staff Login
          </button>
          <span style={{ color: isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.2)' }}>·</span>
          <a
            href="https://github.com/AbGisHere/Brew-and-Bites"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs opacity-40 hover:opacity-90 transition-opacity"
            style={{ color: isDark ? '#D4A76A' : '#8B5A2B' }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 1.1 }}
        style={{ color: isDark ? 'rgba(212,167,106,0.4)' : 'rgba(139,90,43,0.4)' }}
      >
        <span className="text-xs tracking-[0.4em] uppercase">scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
