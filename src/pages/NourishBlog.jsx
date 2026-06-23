import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function NourishBlog() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="">
        <div className="bg-[#133F30] h-5"></div>
    <div className="w-full px-5 py-10">

      <div className="relative mb-8">
        <img src="/yoga.png" alt="" className="absolute right-2 top-0 w-28 h-28 rounded-full bg-gray-200"/>
        <img src="/running.png" alt="" className="absolute right-0 top-32 w-24 h-24 rounded-full bg-gray-200"/>
        <img src="/drinking.png" alt="" className="absolute right-24 top-60 w-24 h-24 rounded-full bg-gray-200"/>

        <h1 className="alata-font text-4xl font-bold leading-tight
                       text-[#1B3A4B] max-w-[55%] relative z-10">
          Nourish Beyond Nutrition.
        </h1>

        <div className="h-56" />
      </div>

      <div className="relative overflow-hidden transition-all duration-500 mt-5"
        style={{ maxHeight: expanded ? "500px" : "176px" }}
      >
        <p className="alata-font text-lg leading-relaxed text-[#1B3A4B]">
          True wellness isn't just about what we eat, it's about
          how we live, think, and feel. Stress, poor sleep, and
          emotional imbalance can weaken the body as much as
          nutrient deficiencies do. Combining mindful practices
          like meditation or journaling with nourishing
          supplements we create a holistic routine that supports
          both mental clarity and physical vitality.
        </p>

        {!expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-12
                       bg-gradient-to-b from-transparent to-white
                       pointer-events-none"
          />
        )}
      </div>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 mx-auto mt-3
                   alata-font text-lg text-[#1B3A4B]"
      >
        {expanded ? "Read Less" : "Read More"}
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <div className="flex flex-row gap-4 mt-12 items-start">

        <img
          src="/yogurt.png"
          alt="Smoothie bowl"
          className="w-36 h-44 rounded-2xl object-cover flex-shrink-0"
        />

        <div className="flex flex-col gap-3">
          <h2 className="alata-font text-xl font-semibold leading-snug
                         text-[#1B3A4B]">
            Why You Might Still Have Nutritional Gaps — Even With
            a Healthy Diet
          </h2>

          <p className="alata-font text-sm text-gray-600 leading-relaxed">
            Nutritional gaps can linger even with a clean diet
            because your body's needs often outpace what food
            alone can consistently deliver.
          </p>

          <button className="self-start rounded-md bg-[#133F30]
                             px-5 py-2.5 text-white alata-font text-sm">
            Read More
          </button>
        </div>

      </div>

    </div>
    </div>
  );
}