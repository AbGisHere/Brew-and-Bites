import { Link } from 'react-scroll'

export default function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center bg-cover bg-center" 
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1771&q=80)'
      }}>
      <div className="text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Brew & Bites</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">Experience the perfect blend of rich coffee and delicious food in a cozy atmosphere.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="menu"
            smooth={true}
            duration={500}
            className="bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
          >
            View Our Menu
          </Link>
          <Link
            to="contact"
            smooth={true}
            duration={500}
            className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white border-2 border-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105"
          >
            Reserve a Table
          </Link>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <Link
          to="about"
          smooth={true}
          duration={500}
          className="flex flex-col items-center text-white cursor-pointer"
        >
          <span className="mb-2">Scroll Down</span>
          <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
