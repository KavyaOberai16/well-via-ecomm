import { motion, useReducedMotion } from 'framer-motion';

export default function DealsBanner() {
  const reduce = useReducedMotion();

  return (
    <section className="mt-6 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="
          relative
          flex
          items-center
          justify-center
          bg-[#133F30]
          text-white
          px-4
          h-10
          w-full
          overflow-visible
        "
      >
        {/* CENTER LOGO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src="/juice.png"
            alt="juice logo"
            className="
              h-56
              w-auto
              object-contain
              -translate-y-8
            "
          />
        </div>

        {/* RIGHT TEXT */}
        <div className="
          absolute 
          right-4 
          sm:right-6 
          text-xs sm:text-sm 
          font-medium 
          whitespace-nowrap
          amita-font
        ">
          more coming soon!
        </div>
      </motion.div>
    </section>
  );
}