'use client';

import React from 'react';

// --- Icon Components for Features ---
const InnovationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const QualityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);
const GrowthIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const products = [
    { name: "Hydro-S", description: "A unique surface sterilent and biocide for combating fungal and bacterial infections." },
    { name: "Leksa", description: "Increases flower count, converts them to fruit faster, and makes the crop vigorous for higher income." },
    { name: "Fruit Drip", description: "A biotechnological innovation to improve fruit quality, based on high-tech fermentation of seaweed and Amino Proteins." },
    { name: "NIWON", description: "A special product made from essential oils to prevent Anobiidae insect species." },
    { name: "FORCE-333", description: "An ideal botanical extract for effective management of hard-to-kill thrips, mites, and other sucking pests." },
    { name: "RAMP", description: "Contains bio-organic root extract used as prophylactic treatment against fungal & bacterial infections in various crops." },
    { name: "GREEN PLUS", description: "Improves root development, sugar brix, color & size uniformity, shelf life, and overall yield." },
    { name: "JWALA SAMRAT", description: "Organic fertilizer with an unpleasant taste that deters insects and animals from feeding on plants for 30-50 days." },
    { name: "Active Grapes", description: "A high-quality organism for managing grape clusters, improving color, shape, and size." },
    { name: "Stroke Super", description: "A high-quality hormone useful for grape bunches, promoting size growth and color uniformity." },
    { name: "Well Berry Plus", description: "A 100% organic hormone that promotes vigorous growth and improves berry size and color in grapes." },
    { name: "Capsule Super+", description: "Increases cytokinin levels to induce cell division and elongation, especially for long grape varieties." },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800 font-sans antialiased">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <a href="#" className="flex items-center">
            <img src="/logo.png" alt="Valine Agro Industries Logo" className="h-12 md:h-14" />
          </a>
          {/* --- UPDATED: Single Login Button --- */}
          <a
            href="/login"
            className="px-8 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Login
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[80vh] bg-cover bg-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-black/30 flex flex-col justify-center items-center p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-center leading-tight shadow-text">
              Pioneering the Future of Agriculture
            </h1>
            <p className="mt-6 text-lg md:text-xl text-center max-w-3xl shadow-text font-medium">
              Harnessing the power of biotechnology and nano-technology to deliver innovative solutions for healthier crops and greater yields.
            </p>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">Why Valine Agro?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="flex flex-col items-center">
                        <div className="bg-green-700 p-5 rounded-full shadow-lg">
                            <InnovationIcon />
                        </div>
                        <h3 className="text-xl font-bold mt-6 mb-2">Advanced Technology</h3>
                        <p className="text-gray-600">We leverage cutting-edge nano-technology and high-tech fermentation processes to create superior products.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-green-700 p-5 rounded-full shadow-lg">
                            <QualityIcon />
                        </div>
                        <h3 className="text-xl font-bold mt-6 mb-2">Organic & Safe</h3>
                        <p className="text-gray-600">Our commitment to organic and biotechnological solutions ensures healthier crops and a safer environment.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-green-700 p-5 rounded-full shadow-lg">
                            <GrowthIcon />
                        </div>
                        <h3 className="text-xl font-bold mt-6 mb-2">Proven Results</h3>
                        <p className="text-gray-600">Our products are designed to increase crop vigor, improve yields, and help our partners achieve a higher income.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Premier Products</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">A catalog of our innovative solutions designed for modern agricultural needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.name} className="bg-white rounded-lg shadow-lg p-8 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
                    <h3 className="text-2xl font-bold text-green-800 mb-3">{product.name}</h3>
                    <p className="text-gray-600 text-lg flex-grow">
                        {product.description}
                    </p>
                </div>
              ))}
            </div>
          </div>
        </section>

         {/* Call to Action Section */}
        <section className="relative bg-cover bg-center py-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587880392199-abc633930b7e?q=80&w=1933&auto=format&fit=crop')"}}>
            <div className="absolute inset-0 bg-green-900 bg-opacity-70"></div>
            <div className="relative container mx-auto px-6 text-center text-white">
                <h2 className="text-4xl font-extrabold mb-4 shadow-text">Join Our Growing Network</h2>
                <p className="text-xl mb-8 max-w-3xl mx-auto shadow-text">
                    Become a part of a forward-thinking community dedicated to bringing the future of sustainable agriculture to farms everywhere.
                </p>
                {/* --- UPDATED: Single Login Button --- */}
                <a
                    href="/login"
                    className="inline-block px-12 py-4 bg-white text-green-800 font-bold rounded-lg text-lg hover:bg-gray-200 transition-colors shadow-2xl transform hover:scale-105"
                >
                    Access the Portal
                </a>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
                <img src="/logo.png" alt="Valine Agro Industries Logo" className="h-14 mx-auto md:mx-0 mb-4" />
                <p className="text-gray-400">
                    Pioneering innovative and organic solutions for modern agriculture to ensure healthier crops and greater yields for our partners.
                </p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h3>
                <ul className="space-y-2">
                    <li><a href="#" className="hover:text-green-400 transition-colors">Home</a></li>
                    <li><a href="#products" className="hover:text-green-400 transition-colors">Our Products</a></li>
                    {/* --- UPDATED: Single Login Link --- */}
                    <li><a href="/login" className="hover:text-green-400 transition-colors">Login</a></li>
                </ul>
            </div>
            <div>
                 <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Contact Us</h3>
                 <address className="not-italic space-y-3 text-gray-400">
                    <p>Plot No.Gn 122/Shop No:5, Office Janori MIDC, Dist: Nashik, Maharashtra</p>
                    <p><strong>Customer Care:</strong> <a href="tel:8010832395" className="hover:text-green-400 font-semibold">8010832395</a></p>
                    <p><strong>Email:</strong> <a href="mailto:valinagroind@gmail.com" className="hover:text-green-400 font-semibold">valinagroind@gmail.com</a></p>
                 </address>
            </div>
        </div>
        <div className="border-t border-gray-800 py-6">
            <p className="text-center text-gray-500">
                © {new Date().getFullYear()} Valine Agro Industries. All Rights Reserved.
            </p>
        </div>
      </footer>

      <style jsx>{`
        .shadow-text {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
}

