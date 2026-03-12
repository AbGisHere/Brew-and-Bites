import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Stars, Environment, Float } from '@react-three/drei'
import { motion, useScroll, useTransform } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

// Pastel color palette
const PASTEL_COLORS = {
  pink: '#FFB3D1',
  lightPink: '#FFE5F1',
  green: '#B3E5D1',
  lightGreen: '#E5F5EB',
  purple: '#D1B3FF',
  yellow: '#FFF3B3'
}

// Paint Brush 3D Component
function PaintBrush({ position, rotation = [0, 0, 0], scale = 1 }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      timeRef.current += delta
      meshRef.current.rotation.y = rotation[1] + Math.sin(timeRef.current) * 0.1
      meshRef.current.rotation.x = rotation[0] + Math.cos(timeRef.current * 0.8) * 0.05
    }
  })

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Brush handle */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 8]} />
        <meshPhysicalMaterial color="#8B4513" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Ferrule */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshPhysicalMaterial color="#C0C0C0" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Bristles */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.06, 0.04, 0.3, 6]} />
        <meshPhysicalMaterial color={PASTEL_COLORS.pink} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Palette 3D Component
function Palette({ position, rotation = [0, 0, 0], scale = 1 }) {
  const meshRef = useRef()
  const timeRef = useRef(0)
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      timeRef.current += delta
      meshRef.current.rotation.z = rotation[2] + Math.sin(timeRef.current * 0.7) * 0.15
    }
  })

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Main palette */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#DEB887" roughness={0.4} />
      </mesh>
      {/* Paint circles */}
      {[PASTEL_COLORS.pink, PASTEL_COLORS.green, PASTEL_COLORS.purple, PASTEL_COLORS.yellow].map((color, i) => (
        <mesh key={i} position={[0.3 * (i - 1.5), 0, 0.05]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
          <meshPhysicalMaterial color={color} roughness={0.2} />
        </mesh>
      ))}
      {/* Thumb hole */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
        <meshPhysicalMaterial color="#8B4513" roughness={0.5} />
      </mesh>
    </group>
  )
}

// Flower 3D Component
function Flower({ position, rotation = [0, 0, 0], scale = 1 }) {
  const groupRef = useRef()
  const timeRef = useRef(0)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      timeRef.current += delta
      groupRef.current.rotation.y = rotation[1] + Math.sin(timeRef.current * 0.5) * 0.2
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current * 0.8) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1, 8]} />
        <meshPhysicalMaterial color={PASTEL_COLORS.green} roughness={0.6} />
      </mesh>
      {/* Petals */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[0.2 * Math.cos((i * Math.PI * 2) / 6), 0, 0.2 * Math.sin((i * Math.PI * 2) / 6)]}
          rotation={[0, 0, (i * Math.PI * 2) / 6]}
        >
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshPhysicalMaterial color={PASTEL_COLORS.pink} roughness={0.3} />
        </mesh>
      ))}
      {/* Center */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshPhysicalMaterial color={PASTEL_COLORS.yellow} roughness={0.2} />
      </mesh>
    </group>
  )
}

// 3D Scene
function PastelScene({ mouseX, mouseY }) {
  const sceneRef = useRef()

  useFrame(() => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y += (mouseX * 0.05 - sceneRef.current.rotation.y) * 0.02
      sceneRef.current.rotation.x += (-mouseY * 0.03 - sceneRef.current.rotation.x) * 0.02
    }
  })

  const artisticElements = useMemo(() => [
    { type: 'brush', position: [-2, 1, 0], rotation: [0.5, 0.3, 0], scale: 0.8 },
    { type: 'palette', position: [2, -0.5, 1], rotation: [0, 0, 0.2], scale: 1.2 },
    { type: 'flower', position: [0, 1.5, -1], rotation: [0, 0, 0], scale: 1 },
    { type: 'brush', position: [1.5, 0.8, -0.5], rotation: [-0.3, -0.5, 0], scale: 0.6 },
    { type: 'flower', position: [-1, -0.8, 0.5], rotation: [0, 0, 0], scale: 0.8 },
    { type: 'palette', position: [-0.5, -1, -0.8], rotation: [0, 0, -0.3], scale: 0.7 },
  ], [])

  return (
    <>
      <ambientLight intensity={0.6} color={PASTEL_COLORS.lightPink} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color={PASTEL_COLORS.pink} />
      <pointLight position={[-5, 3, 3]} intensity={0.8} color={PASTEL_COLORS.green} />
      <pointLight position={[0, -5, 2]} intensity={0.6} color={PASTEL_COLORS.purple} />
      <Environment preset="sunset" background={false} />
      
      <Sparkles
        count={40}
        scale={[15, 10, 8]}
        size={2}
        speed={0.1}
        color={PASTEL_COLORS.pink}
        opacity={0.4}
      />
      
      <group ref={sceneRef}>
        {artisticElements.map((element, i) => {
          if (element.type === 'brush') {
            return <PaintBrush key={i} {...element} />
          } else if (element.type === 'palette') {
            return <Palette key={i} {...element} />
          } else if (element.type === 'flower') {
            return <Flower key={i} {...element} />
          }
          return null
        })}
      </group>
    </>
  )
}

const PastelPoetryLanding = ({ restaurant }) => {
  const navigate = useNavigate()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const { scrollY } = useScroll()
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const textY = useTransform(scrollY, [0, vh], [0, -80])
  const textOpacity = useTransform(scrollY, [0, vh * 0.75], [1, 0])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMouse = (e) => setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
    const onTouch = (e) => {
      const t = e.touches[0]
      setMouse({
        x: (t.clientX / window.innerWidth - 0.5) * 2,
        y: (t.clientY / window.innerHeight - 0.5) * 2,
      })
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: `linear-gradient(135deg, ${PASTEL_COLORS.lightPink} 0%, ${PASTEL_COLORS.lightGreen} 50%, ${PASTEL_COLORS.lightPink} 100%)`,
      fontFamily: 'Georgia, serif'
    }}>
      {/* 3D Canvas Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <PastelScene mouseX={mouse.x} mouseY={mouse.y} />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 40% 60% at 30% 40%, rgba(255,229,241,0.7) 0%, transparent 70%)',
      }} />

      {/* Navigation Header */}
      <motion.header 
        className="relative z-20 backdrop-blur-md bg-white/30 border-b border-white/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-light" style={{ 
              color: '#D1477A',
              textShadow: '2px 2px 4px rgba(209,71,122,0.1)',
              letterSpacing: '0.05em'
            }}>
              🎨 {restaurant?.name || 'Pastel Poetry'}
            </h1>
            <p className="text-sm md:text-base mt-2" style={{ 
              color: '#6B8E7A',
              fontStyle: 'italic'
            }}>
              Where creativity meets culinary art
            </p>
          </motion.div>
          
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/admin`)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${PASTEL_COLORS.pink}, ${PASTEL_COLORS.purple})`,
                color: 'white',
                boxShadow: '0 4px 15px rgba(255,179,209,0.3)'
              }}
            >
              🎨 Admin
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${PASTEL_COLORS.green}, ${PASTEL_COLORS.lightGreen})`,
                color: 'white',
                boxShadow: '0 4px 15px rgba(179,229,209,0.3)'
              }}
            >
              � All Venues
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 min-h-screen flex items-center justify-center px-6"
        style={{ y: textY, opacity: textOpacity }}
      >
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-12 md:p-16 shadow-2xl border border-white/30">
            <motion.h2 
              className="text-5xl md:text-7xl font-light mb-6"
              style={{ 
                color: '#D1477A',
                textShadow: '1px 1px 3px rgba(209,71,122,0.2)',
                lineHeight: 1.2
              }}
            >
              Welcome to Your
              <br />
              <span className="block" style={{ color: '#6B8E7A' }}>Creative Haven</span>
            </motion.h2>
            
            <motion.p 
              className="text-lg md:text-xl mb-8 leading-relaxed"
              style={{ color: '#666' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Indulge in handcrafted pastries and artisanal beverages,
              where each bite tells a story and every sip inspires creativity.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`)}
                className="group px-8 py-4 rounded-full text-lg font-semibold transition-all"
                style={{
                  background: `linear-gradient(135deg, ${PASTEL_COLORS.pink}, ${PASTEL_COLORS.green})`,
                  color: 'white',
                  boxShadow: '0 8px 25px rgba(255,179,209,0.4)',
                  letterSpacing: '0.05em'
                }}
              >
                🎨 Begin Your Creative Journey
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl md:text-5xl font-light text-center mb-16"
            style={{ color: '#D1477A' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Creative Offerings
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Artisan Pastries',
                description: 'Handcrafted with love and creativity',
                color: PASTEL_COLORS.pink
              },
              {
                icon: '☕',
                title: 'Creative Beverages',
                description: 'Unique blends and artistic presentations',
                color: PASTEL_COLORS.green
              },
              {
                icon: '🌸',
                title: 'Inspiring Ambiance',
                description: 'Perfect for creative work and inspiration',
                color: PASTEL_COLORS.purple
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/30"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-6xl mb-4 text-center">{feature.icon}</div>
                <h3 className="text-2xl font-light mb-3 text-center" style={{ color: feature.color }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6" style={{ 
        background: `linear-gradient(135deg, ${PASTEL_COLORS.pink}, ${PASTEL_COLORS.green})`,
        color: 'white'
      }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-90">
            © 2024 {restaurant?.name || 'Pastel Poetry'}. Crafted with creativity and passion.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PastelPoetryLanding
