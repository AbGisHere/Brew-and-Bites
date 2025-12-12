export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">About Brew & Bites</h2>
          <div className="w-24 h-1 bg-primary mb-6"></div>
          <p className="text-gray-600 leading-relaxed mb-6">
            At Brew & Bites, we believe coffee is an experience. From sourcing the finest beans to crafting
            each cup with care, our baristas are passionate about delivering rich flavors and warm hospitality.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Whether you're here for a quick espresso or a lingering brunch, our cozy space, friendly faces,
            and delicious bites will make you feel right at home.
          </p>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80"
            alt="Barista pouring latte art"
            className="rounded-lg shadow-lg w-full object-cover h-80"
          />
          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-md">
            <div className="text-primary text-3xl font-bold">2015</div>
            <div className="text-gray-600 text-sm">Serving smiles since</div>
          </div>
        </div>
      </div>
    </section>
  )
}
