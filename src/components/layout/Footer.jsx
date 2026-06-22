import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ChevronDown } from "lucide-react";

function Ticker() {
  return (
    <div className="mt-8 w-full overflow-hidden border-y border-white/10 bg-[#F5EBD7] py-2 text-black text-sm">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap alata-font">
        <span>✨ Daily wellness tips & expert insights</span>
        <span>•</span>
        <span>🍃 Discover the benefits of functional gummies</span>
        <span>•</span>
        <span>💚 Better sleep, stress support & daily balance</span>
        <span>•</span>
        <span>📩 Subscribe for exclusive wellness updates</span>

        <span>✨ Daily wellness tips & expert insights</span>
        <span>•</span>
        <span>🍃 Discover the benefits of functional gummies</span>
        <span>•</span>
        <span>💚 Better sleep, stress support & daily balance</span>
        <span>•</span>
        <span>📩 Subscribe for exclusive wellness updates</span>
      </div>
    </div>
  );
}

export default function Footer() {
  const [open, setOpen] = useState(null);

  const toggle = (id) => {
    setOpen((prev) => (prev === id ? null : id));
  };

  const Section = ({ title, id, children }) => {
    const isOpen = open === id;

    return (
      <div className="border-b border-white/10 py-3">

        <button
          onClick={() => toggle(id)}
          className="flex justify-between w-full text-left text-white text-lg"
        >
          {title}

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
            marginTop: isOpen ? 12 : 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-2 text-white/70">
            {children}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
  
      <Ticker />

    
      <footer className="bg-[#133F30] text-white px-6 py-12 alata-font">

        <div className="mb-10 mt-6">
          <h2 className="text-3xl font-semibold">WELLVIA</h2>
          <p className="text-white/60">Wellness Redefined</p>
        </div>

        <Section id="shop" title="Shop">
          <Link>All Products</Link>
          <Link>Best Sellers</Link>
          <Link>New Arrivals</Link>
        </Section>

        <Section id="categories" title="Categories">
          <Link>Skincare</Link>
          <Link>Nutrition</Link>
          <Link>Fitness</Link>
        </Section>

        <Section id="blog" title="Blog">
          <Link>Latest Posts</Link>
          <Link>Wellness Tips</Link>
        </Section>

        <Section id="contact" title="Contact">
          <p>hello@wellvia.com</p>
          <p>+91 9876543210</p>
        </Section>

        <div className="mt-10 alata-font">
          <p className="mb-3 font-medium">Subscribe to newsletter</p>

          <div className="relative">
            <input
              placeholder="Enter your email"
              className="w-full rounded-full px-5 py-3 text-black outline-none"
            />

            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#173B2F] text-white p-2 rounded-full">
              <Mail size={16} />
            </button>
          </div>
        </div>

        <div className="mt-10 text-white/40 text-sm">
          © 2026 Wellvia. All rights reserved.
        </div>

      </footer>
    </>
  );
}