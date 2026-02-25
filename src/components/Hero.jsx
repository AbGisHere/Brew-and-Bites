import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { motion, useScroll, useTransform } from 'motion/react'
import { useTheme } from '../context/ThemeContext'

// ─── Coffee Bean ──────────────────────────────────────────────────────────────
function CoffeeBean({ position, speed = 1.0, beanScale = 1.0, isDark }) {
  const meshRef = useRef()
  const initY = position[1]
  const color = useMemo(() => {
    const palette = isDark
      ? ['#3d1a08', '#5c2a12', '#2a0b00', '#6b3420', '#4a1a08']
      : ['#5c2a12', '#8B5A2B', '#3d1a08', '#7a3b1a', '#6b3420']
    return palette[Math.floor(Math.random() * palette.length)]
  }, [isDark])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!meshRef.current) return
    meshRef.current.position.y = initY + Math.sin(t * speed + position[0]) * 0.35
    meshRef.current.rotation.x += 0.004 * speed
    meshRef.current.rotation.z += 0.007 * speed
  })

  return (
    <mesh ref={meshRef} position={position} scale={[beanScale, beanScale * 0.65, beanScale * 0.45]}>
      <sphereGeometry args={[0.22, 8, 6]} />
      <meshStandardMaterial
        color={color}
        roughness={isDark ? 0.85 : 0.7}
        metalness={0.05}
        emissive={color}
        emissiveIntensity={isDark ? 0.18 : 0.08}
      />
    </mesh>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ mouseX, mouseY, isDark }) {
  const sceneRef = useRef()
  useFrame(() => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y += (mouseX * 0.1 - sceneRef.current.rotation.y) * 0.03
      sceneRef.current.rotation.x += (-mouseY * 0.06 - sceneRef.current.rotation.x) * 0.03
    }
  })
  const beans = useMemo(() =>
    Array.from({ length: 22 }, () => ({
      position: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5 - 1],
      speed: 0.2 + Math.random() * 0.4,
      beanScale: 0.35 + Math.random() * 0.8,
    }))
  , [])
  return (
    <>
      <ambientLight intensity={isDark ? 0.25 : 0.9} color={isDark ? '#D4A76A' : '#FFF3E0'} />
      <pointLight position={[4, 4, 4]} intensity={isDark ? 2.8 : 1.6} color="#D4A76A" />
      <pointLight position={[-5, 2, 3]} intensity={isDark ? 1.6 : 0.9} color="#FF8C42" />
      <pointLight position={[0, -4, 2]} intensity={isDark ? 0.8 : 0.3} color="#8B5A2B" />
      <pointLight position={[1.8, 2, 5]} intensity={isDark ? 1.2 : 0.6} color="#FFB347" />
      <group ref={sceneRef}>
        {isDark && <Stars radius={50} depth={30} count={300} factor={2} saturation={0} fade speed={0.3} />}
        <Sparkles count={isDark ? 55 : 30} scale={[18, 12, 8]} size={isDark ? 1.5 : 1.1} speed={0.15} color={isDark ? '#D4A76A' : '#B9864B'} opacity={isDark ? 0.35 : 0.2} />
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
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef()

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handle = (e) => setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
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
    <section ref={heroRef} id="home" className="relative h-screen overflow-hidden" style={{ background: bg }}>
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
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent, ${fadeBottom})` }} />

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
