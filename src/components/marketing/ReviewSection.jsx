import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ReviewsSection() {
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

  return (
    <section className="px-4 mt-12">
      {/* Heading */}
      <h2 className="text-center text-xl font-semibold mb-6 alata-font">
        The Reviews Behind the Routine
      </h2>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-4">
        <div className="flex items-center gap-4 alata-font">

          {/* LEFT SIDE - AVATARS */}
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

          {/* RIGHT SIDE - REVIEW */}
          <div className="relative w-1/2 min-h-[160px] flex flex-col justify-center pl-2">

            {/* Top Right Quote */}
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
    {/* Stars */}
    <div className="text-yellow-500 text-sm">
      {"★".repeat(review.rating)}
      {"☆".repeat(5 - review.rating)}
    </div>

    {/* Review Text */}
    <p className="mt-3 text-xs text-gray-700 leading-relaxed pr-4">
      {review.text}
    </p>

    {/* Reviewer */}
    <p className="mt-3 mb-5 text-sm font-medium text-gray-900">
      — {review.name}
    </p>
  </motion.div>
</AnimatePresence>
            {/* Bottom Left Faded Quote */}
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
  );
}