import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Checkout(){
    const reviews = [
        {
          rating: 5,
          text: "Finally, a wellness routine I actually stick to.",
          name: "Priya S.",
        },
        {
          rating: 5,
          text: "The gummies taste amazing and fit perfectly into my day.",
          name: "Ananya K.",
        },
        {
          rating: 4,
          text: "Simple, effective and easy to stay consistent with.",
          name: "Jessica",
        },
        {
          rating: 5,
          text: "No complicated wellness plans. Just one gummy and I'm good to go.",
          name: "Arjun",
        },
        {
          rating: 4,
          text: "The best part? It doesn't feel like a chore. It feels like a habit I actually enjoy.",
          name: "Karan",
        },
      ];
    
      const [currentReview, setCurrentReview] = useState(0);
    
      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentReview((element) => (element + 1) % reviews.length);
        }, 4000);
    
        return () => clearInterval(timer);
      }, [reviews.length]);
    
      const review = reviews[currentReview];

    return(
        <div className="">

             <div className="bg-[#133F30] h-5"></div>
      <div className="flex items-center gap-3 ml-4 mt-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border">
       ←
      </div>

  <h1 className="alata-font text-lg font-bold">
    Checkout
  </h1>
</div>
<div className="w-full min-h-screen bg-[#EDEFF5] pb-10">

      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-1.5 text-xs 
                        font-medium text-[#1B3A4B]">
          100% secured payment 🔒
        </div>
      </div>

      <div className="px-5 mb-2">
        <p className="text-sm text-[#1B3A4B] mb-2">Step 1 of 3</p>
        <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#1B3A4B] rounded-full" />
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">

          <div className="bg-[#0D0D0D] text-white text-center 
                          text-xs font-medium py-2 tracking-wide">
            Prepaid Orders are delivered faster!
          </div>
          <div className="flex items-start justify-between p-5">
            <div className="flex gap-3">
              <span className="text-2xl mt-1">🛒</span>
              <div>
                <h2 className="text-lg font-bold text-[#1B3A4B] mb-1">
                  Order Overview
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  3 items in your box
                </p>
                <span className="inline-block bg-teal-50 text-teal-700 
                                 text-xs font-semibold px-3 py-1 
                                 rounded-full">
                  Great Pick — ₹447 Saved
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold text-[#1B3A4B]">
                ₹349.00
              </p>
              <p className="text-xs text-gray-400 line-through">
                ₹349.00
              </p>
            </div>
          </div>

          <div className="bg-teal-50 px-5 py-4 flex items-center 
                          justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1B3A4B]">
                You're saving more!
              </p>
              <p className="text-xs text-gray-500">
                Keep going, you are doing great
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1B3A4B] mb-1">
                12% Savings
              </p>
              <div className="w-24 h-1.5 bg-gray-200 rounded-full 
                              overflow-hidden">
                <div className="h-full w-3/4 bg-[#1B3A4B] rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 
                          border-t border-gray-100">
            <div className="flex gap-3 items-start">
              <span className="text-2xl">🎟️</span>
              <div>
                <h3 className="text-base font-semibold text-[#1B3A4B]">
                  Offers & Rewards
                </h3>
                <p className="text-xs text-gray-500">
                  Save more on your order
                </p>
              </div>
            </div>
            <button className="bg-[#1B3A4B] text-white text-sm 
                               font-semibold px-6 py-2.5 rounded-lg
                               hover:bg-[#2A5268] transition-colors">
              Apply
            </button>
          </div>

          <div className="flex items-center justify-between p-5 
                          border-t border-gray-100">
            <div className="flex gap-3 items-center">
              <span className="text-2xl">👤</span>
              <div>
                <h3 className="text-base font-semibold text-[#1B3A4B]">
                  Login to continue
                </h3>
                <p className="text-xs text-gray-400">+91</p>
              </div>
            </div>
            <button className="bg-[#1B3A4B] text-white text-sm 
                               font-semibold px-6 py-2.5 rounded-lg
                               hover:bg-[#2A5268] transition-colors">
              Login
            </button>
          </div>

        </div>
      </div>

      <div className="text-center mt-8 px-5">
        <p className="text-sm font-semibold text-[#1B3A4B] underline 
                      cursor-pointer mb-1">
          Still Thinking? Read This First
        </p>
        <p className="text-xs text-gray-400">
          4.8/5 by 2,000+ customers
        </p>
      </div>

    </div>

     <section className="px-4 mt-12">
      <h2 className="text-center text-xl font-semibold mb-6 alata-font">
        The Reviews Behind the Routine
      </h2>


      <div className="bg-white rounded-3xl border border-gray-200 p-4">
        <div className="flex items-center gap-4 alata-font">

       
          <div className="relative w-1/2 h-40">

            <img
              src="/avatar3F.jpg"
              alt=""
              className="absolute top-0 left-6 w-10 h-10 rounded-full object-cover"
            />

            <img
              src="/avatar4F.jpg"
              alt=""
              className="absolute top-2 right-4 w-10 h-10 rounded-full object-cover"
            />

            <img
              src="/avatar5F.jpg"
              alt=""
              className="absolute top-14 left-0 w-10 h-10 rounded-full object-cover"
            />

            <img
              src="/avatar1M.png"
              alt=""
              className="absolute top-16 right-4 w-10 h-10 rounded-full object-cover"
            />

            <img
              src="/avatar2M.png"
              alt=""
              className="absolute bottom-5 left-12 w-10 h-10 rounded-full object-cover"
            />

          </div>

       
          <div className="relative w-1/2 min-h-[160px] flex flex-col justify-center pl-2">

         
            <div className="absolute top-0 right-0 text-4xl font-bold text-black leading-none">
              "
            </div>

            <AnimatePresence mode="wait">
  <motion.div
    key={currentReview}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1.2 }}
  >
 
    <div className="text-yellow-500 text-sm">
      {"★".repeat(review.rating)}
      {"☆".repeat(5 - review.rating)}
    </div>

  
    <p className="mt-3 text-xs text-gray-700 leading-relaxed pr-4">
      {review.text}
    </p>

 
    <p className="mt-3 mb-5 text-sm font-medium text-gray-900">
      — {review.name}
    </p>
  </motion.div>
</AnimatePresence>
        
            <div className="absolute bottom-0 left-0 rotate-180 text-5xl text-gray-200 leading-none">
              "
            </div>

          </div>

        </div>
      </div>

      
      <div className="text-center mt-5 mb-10 alata-font">
        <button className="text-sm underline">
          Check All Reviews →
        </button>
      </div>
    </section>

</div>
    )
}