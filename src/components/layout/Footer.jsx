import { MapPin, Mail, Phone } from "lucide-react";

/**
 * Storefront footer — a deep indigo, "3D" footer matching the design mockup.
 *
 * It stays fully data-driven from the admin footer config (brand, newsletter,
 * link columns, mail/office, social, payments, copyright); only the
 * presentation changed. The 3D feel comes from glossy gradient icon tiles that
 * gently float and tilt on hover, plus soft blurred orbs drifting in the
 * background. All motion respects prefers-reduced-motion.
 */
export default function Footer() {
  return (
    <footer className="bg-[#133F30] text-white mt-16 px-6 py-8">

     <div className="flex justify-between items-start w-full">
  
  {/* LEFT - LOGO */}
  <div className="flex flex-col">
    <img
      src="/wellvia 3.png"
      alt="Wellvia"
      className="w-60 block -ml-4"
    />

    <h2 className="font-semibold text-lg alata-font">
      WELLVIA
    </h2>

    <p className="text-sm opacity-80 alata-font">
      WELLNESS REDEFINED
    </p>
  </div>

  {/* RIGHT - CONTACT */}
  <div className="space-y-3 text-sm alata-font text-right mt-6">
    <div className="flex items-center justify-end gap-2">
      <MapPin size={16} />
      <span>Location</span>
    </div>

    <div className="flex items-center justify-end gap-2">
      <Mail size={16} />
      <span>hello@wellvia.com</span>
    </div>

    <div className="flex items-center justify-end gap-2">
      <Phone size={16} />
      <span>+91 9876543210</span>
    </div>
  </div>

</div>

  

      <div className="border-t border-white/20 my-6 alata-font"></div>


      <div className="space-y-4">

        <div className="flex justify-between items-center border-b border-white/20 pb-3">
          <span>Shop</span>
          <span>∨</span>
        </div>

        <div className="flex justify-between items-center border-b border-white/20 pb-3">
          <span>Categories</span>
          <span>∨</span>
        </div>

        <div className="flex justify-between items-center border-b border-white/20 pb-3">
          <span>Blog</span>
          <span>∨</span>
        </div>

        <div className="flex justify-between items-center border-b border-white/20 pb-3">
          <span>Contact</span>
          <span>∨</span>
        </div>

      </div>

  
      <div className="mt-8">

        <h3 className="font-semibold text-sm mb-4 alata-font">
          SUBSCRIBE TO OUR NEWSLETTER
        </h3>

        <input
          type="email"
          placeholder="Email ID"
          className="w-full rounded-xl px-4 py-3 text-black bg-white"
        />

        <button className="mt-4 rounded-full bg-white text-[#1C3D2E] px-6 py-2 font-medium">
          SUBMIT
        </button>

      </div>

    </footer>
  );
  
}
