import { useState } from "react";
import { Star } from "lucide-react";

export default function Review() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="w-full min-h-screen bg-white px-6 pt-10 pb-12
                    flex flex-col items-center">

      <h1 className="alata-font text-3xl font-bold text-center
                     text-[#1B3A4B] leading-snug mb-6">
        How would you like to rate
        <br />
        this product?
      </h1>

      <div className="flex gap-3 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star
              size={36}
              className="transition-colors duration-150"
              fill={star <= (hoverRating || rating) ? "#1B3A4B" : "none"}
              stroke="#1B3A4B"
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      <div className="w-64 h-72 bg-[#F2EEE6] rounded-lg overflow-hidden mb-4">
        <img
          src="/p2.png"
          alt="Wellvia Sleep Gummies"
          className="w-full h-full object-contain"
        />
      </div>

      <h2 className="alata-font text-2xl text-[#1B3A4B] mb-6">
        Wellvia Sleep Gummies
      </h2>

      <textarea
        placeholder="leave a review"
        rows={6}
        className="w-full max-w-md border border-gray-300 rounded-lg
                   px-4 py-4 text-base text-[#1B3A4B] placeholder-gray-400
                   outline-none focus:border-[#1B3A4B]
                   transition-colors duration-200 resize-none mb-8"
      />

      <button className="rounded-md bg-[#133F30] text-white
                         alata-font text-lg font-semibold
                         px-12 py-3 hover:bg-[#1c4d3b]
                         transition-colors duration-200">
        Submit
      </button>

    </div>
  );
}