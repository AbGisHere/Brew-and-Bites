export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white text-xl font-semibold mb-3">Brew & Bites</h3>
          <p className="text-gray-400">Craft coffee, fresh bites, and cozy vibes in the heart of town.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Hours</h4>
          <ul className="space-y-1 text-gray-400">
            <li>Mon - Fri: 7:00 AM - 8:00 PM</li>
            <li>Sat - Sun: 8:00 AM - 9:00 PM</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Location</h4>
          <p className="text-gray-400">123 Coffee Street<br/>Brewtown, CA 90210</p>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Brew & Bites. All rights reserved.
      </div>
    </footer>
  )
}
