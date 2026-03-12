import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LampContainer } from './ui/lamp'
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Heart, 
  Palette,
  Instagram,
  Facebook,
  Twitter,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

const PastelPoetryLandingNew = ({ restaurant }) => {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const menuItems = [
    {
      name: "Rose Petal Macarons",
      description: "Delicate French macarons infused with wild rose essence.",
      price: "$4.50",
      category: "Signature",
      image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&h=400&fit=crop"
    },
    {
      name: "Lavender Honey Latte",
      description: "Espresso combined with steamed oat milk, lavender syrup, and local honey.",
      price: "$6.00",
      category: "Beverages",
      image: "https://images.unsplash.com/photo-1546785308-23c2fac2f8c0?w=500&h=400&fit=crop"
    },
    {
      name: "Raspberry Mille-Feuille",
      description: "Layers of puff pastry alternating with vanilla custard and fresh raspberries.",
      price: "$8.00",
      category: "Pastries",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&h=400&fit=crop"
    },
    {
      name: "Matcha Sakura Cake",
      description: "A beautiful green tea sponge cake with a hint of cherry blossom cream.",
      price: "$7.50",
      category: "Pastries",
      image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500&h=400&fit=crop"
    },
    {
      name: "Earl Grey Lemon Tart",
      description: "A tangy lemon curd tart with a subtle Earl Grey tea infusion.",
      price: "$6.50",
      category: "Pastries",
      image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=500&h=400&fit=crop"
    },
    {
      name: "Hibiscus Iced Tea",
      description: "Refreshing, tart, and beautifully crimson colored iced herbal tea.",
      price: "$4.50",
      category: "Beverages",
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=400&fit=crop"
    }
  ]

  const galleryImages = [
    "https://images.unsplash.com/photo-1559928394-7e55c5a294b8?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1445116572660-236099fc97f0?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop"
  ]

  const testimonials = [
    {
      name: "Sophie Laurent",
      rating: 5,
      comment: "A true sanctuary of calm. The aesthetic is stunning, and the lavender latte tastes like a dream.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Emma Thompson",
      rating: 5,
      comment: "Every item on the menu feels like a work of art. The perfect spot to unwind and read a book.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c1ca?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Michael Chen",
      rating: 5,
      comment: "Stunning interiors and the pastries are incredibly fresh. A beautiful gem in the city.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-pastel-pink/20 py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pastel-pink to-pastel-olive flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <span className={`text-2xl font-serif font-semibold ${isScrolled ? 'text-slate-800' : 'text-white drop-shadow-md'}`}>
               Pastel Poetry
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className={`font-medium transition-colors hover:text-pastel-pink ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>About</button>
            <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className={`font-medium transition-colors hover:text-pastel-pink ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Menu</button>
            <button onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })} className={`font-medium transition-colors hover:text-pastel-pink ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Gallery</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className={`font-medium transition-colors hover:text-pastel-pink ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Contact</button>
            <button 
              onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`)}
              className="px-6 py-2.5 bg-pastel-olive text-white rounded-full font-medium shadow-md hover:bg-pastel-olive/90 transition-colors flex items-center gap-2"
            >
              Order Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button className="md:hidden text-slate-800 p-2" onClick={() => setMobileMenuOpen(true)}>
            <Menu className={`w-6 h-6 ${isScrolled ? 'text-slate-800' : 'text-white'}`} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween' }}
            className="fixed inset-0 z-[60] bg-white flex flex-col p-6"
          >
            <div className="flex justify-end">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex flex-col gap-6 mt-12 text-2xl font-serif">
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-left text-slate-700">About</button>
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-left text-slate-700">Menu</button>
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-left text-slate-700">Gallery</button>
              <button onClick={() => { setMobileMenuOpen(false); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-left text-slate-700">Contact</button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`) }}
                className="mt-8 px-8 py-4 bg-gradient-to-r from-pastel-pink to-pastel-olive text-white rounded-full text-center font-sans font-medium text-lg"
              >
                Order Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section using LampDemo */}
      <section className="relative w-full overflow-hidden bg-slate-950 min-h-[90vh] md:min-h-screen">
          <LampContainer>
            <motion.div
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
                }}
                className="flex flex-col items-center z-50 text-center px-4"
            >
                <h1 className="mt-8 bg-gradient-to-br from-pastel-pink to-pastel-olive py-4 bg-clip-text text-center text-5xl font-serif tracking-tight text-transparent md:text-7xl lg:text-8xl w-full">
                    Pastel Poetry <br /> <span className="text-3xl md:text-5xl font-sans tracking-normal opacity-90 mt-2 md:mt-4 block">Creative Haven</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg text-slate-300">
                    A serene sanctuary combining artisanal pastries, specialty coffee, and an exquisite pastel ambiance to elevate your everyday moments.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                    <button 
                        onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-pastel-olive text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-pastel-olive/90 transition-all text-center"
                    >
                        Start Your Order
                    </button>
                    <button 
                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-pastel-pink text-pastel-pink rounded-full font-medium hover:bg-pastel-pink/10 transition-all duration-300 text-center"
                    >
                        Explore Our Story
                    </button>
                </div>
            </motion.div>
          </LampContainer>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pastel-light-pink rounded-full blur-[100px] opacity-40 -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pastel-light-olive rounded-full blur-[100px] opacity-40 -z-10 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 w-full"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-pastel-pink to-pastel-olive rounded-[2rem] transform translate-x-4 translate-y-4 -z-10 opacity-60"></div>
              <img 
                src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=1000&fit=crop" 
                alt="Cafe Interior" 
                className="w-full h-auto rounded-[2rem] shadow-xl object-cover aspect-[4/5]"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 space-y-8"
          >
            <div>
              <p className="text-pastel-pink font-semibold tracking-wider uppercase text-sm mb-2">Our Story</p>
              <h2 className="text-4xl md:text-5xl font-serif text-slate-800 leading-tight">
                Crafting magic in every detail
              </h2>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              Founded on the belief that a cafe should be more than just a place to get coffee, Pastel Poetry was designed as a visual and culinary retreat. 
              We blend classical French pastry techniques with modern flavor profiles, all served within an environment designed to inspire peace and creativity.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
               <div>
                 <h4 className="text-3xl font-serif text-slate-800 mb-1">Artisanal</h4>
                 <p className="text-slate-500">Handcrafted daily</p>
               </div>
               <div>
                 <h4 className="text-3xl font-serif text-slate-800 mb-1">Aesthetic</h4>
                 <p className="text-slate-500">Curated spaces</p>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Menu Highlights Section */}
      <section id="menu" className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16">
            <p className="text-pastel-pink font-semibold tracking-wider uppercase text-sm mb-2">Curated Menu</p>
            <h2 className="text-4xl md:text-5xl font-serif text-slate-800">Tastes of Poetry</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
             {menuItems.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group bg-slate-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col"
              >
                <div className="relative h-60 overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10"></div>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-pastel-pink z-20 shadow-sm">
                    {item.category}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="text-xl font-serif font-medium text-slate-800 line-clamp-2">{item.name}</h3>
                    <span className="font-medium text-slate-800 shrink-0">{item.price}</span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mt-auto pt-2">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-16 text-center w-full"
          >
             <button 
                onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`)}
                className="px-8 py-3 border-2 border-slate-200 text-slate-700 rounded-full font-medium hover:border-pastel-pink hover:text-pastel-pink hover:bg-pastel-light-pink/30 transition-all duration-300 mx-auto block"
             >
                View Full Menu
             </button>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <p className="text-pastel-pink font-semibold tracking-wider uppercase text-sm mb-2">Our Vibe</p>
            <h2 className="text-4xl md:text-5xl font-serif text-slate-800">Visual Poetry</h2>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-slate-500 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
              <Instagram className="w-4 h-4" />
              <span className="text-sm font-medium">@pastelpoetry</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
           {galleryImages.map((src, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className={`relative rounded-2xl overflow-hidden group ${i === 0 || i === 3 ? 'col-span-2 md:col-span-2 md:row-span-2' : ''}`}
             >
               <img 
                 src={src} 
                 alt={`Gallery image ${i+1}`} 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[150px] sm:min-h-[200px]"
                 style={{ height: i === 0 || i === 3 ? '100%' : '250px' }}
               />
               <div className="absolute inset-0 bg-pastel-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply pointer-events-none"></div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pastel-pink rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pastel-olive rounded-full blur-[120px]"></div>
         </div>
         
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <Heart className="w-8 h-8 text-pastel-pink mx-auto mb-4 fill-pastel-pink/20" />
              <h2 className="text-4xl font-serif mb-4">Beloved by our guests</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               {testimonials.map((t, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.15 }}
                   className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors flex flex-col"
                 >
                    <div className="flex gap-1 text-pastel-pink mb-6">
                      {[...Array(t.rating)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-lg leading-relaxed text-slate-200 mb-8 flex-1">"{t.comment}"</p>
                    <div className="flex items-center gap-4">
                      <img src={t.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20" alt={t.name}/>
                      <span className="font-serif font-medium">{t.name}</span>
                    </div>
                 </motion.div>
              ))}
            </div>
         </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col grid-cols-1 md:grid-cols-12 gap-16 mb-16 md:grid flex-wrap">
          
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pastel-pink to-pastel-olive flex items-center justify-center text-white shadow-sm">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-2xl font-serif font-semibold text-slate-800">
                  Pastel Poetry
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-sm">
                Where creativity meets culinary excellence in every cup and pastry. A sanctuary for senses.
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pastel-pink hover:border-pastel-pink transition-colors">
                 <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pastel-pink hover:border-pastel-pink transition-colors">
                 <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pastel-pink hover:border-pastel-pink transition-colors">
                 <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
             <h4 className="font-serif text-lg font-medium text-slate-800 mb-6">Contact Us</h4>
             <ul className="space-y-4 text-slate-500">
               <li className="flex items-start gap-3">
                 <MapPin className="w-5 h-5 text-pastel-pink shrink-0" />
                 <span>123 Artisan Lane,<br/>Creative District, CD 90210</span>
               </li>
               <li className="flex items-center gap-3">
                 <Phone className="w-5 h-5 text-pastel-pink shrink-0" />
                 <span>(555) 123-4567</span>
               </li>
               <li className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-pastel-pink shrink-0" />
                 <span className="break-all">hello@pastelpoetry.com</span>
               </li>
             </ul>
          </div>

          <div className="md:col-span-4 w-full">
             <h4 className="font-serif text-lg font-medium text-slate-800 mb-6">Opening Hours</h4>
             <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <div className="flex justify-between items-center text-slate-600">
                 <span className="font-medium">Mon - Fri</span>
                 <span>7:00 AM - 8:00 PM</span>
               </div>
               <div className="h-px w-full bg-slate-200"></div>
               <div className="flex justify-between items-center text-slate-600">
                 <span className="font-medium">Saturday</span>
                 <span>8:00 AM - 9:00 PM</span>
               </div>
               <div className="h-px w-full bg-slate-200"></div>
               <div className="flex justify-between items-center text-pastel-pink font-medium">
                 <span>Sunday</span>
                 <span>8:00 AM - 6:00 PM</span>
               </div>
             </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
           <p className="text-center md:text-left">&copy; {new Date().getFullYear()} {restaurant?.name || 'Pastel Poetry'}. All rights reserved.</p>
           <div className="flex gap-6">
             <a href="#" className="hover:text-slate-600">Privacy Policy</a>
             <a href="#" className="hover:text-slate-600">Terms of Service</a>
           </div>
        </div>
      </footer>
    </div>
  )
}

export default PastelPoetryLandingNew
