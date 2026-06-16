export default function NourishSection() {
  return (
    <section className="relative bg-[#F5F5F5] py-14 px-4 sm:px-6 overflow-hidden">

      {/* CONTENT */}
      <div className="relative max-w-content mx-auto text-center alata-font">

        {/* HEADING */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Nourish Beyond Nutrition.
        </h2>

        <button className="mt-3 px-4 py-1.5 border border-black rounded-full text-sm">
          Featured
        </button>

        {/* PARAGRAPH */}
        <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl mx-auto alata-font">
          True wellness isn’t just about what we eat, it’s about how we live, think, and feel. Stress, 
          poor sleep, and emotional imbalance can weaken the body as much as nutrient deficiencies do. 
          Combining mindful practices like meditation or journaling with nourishing supplements we create a 
          holistic routine that supports both mental clarity and physical vitality. 
        </p>

        <div className="relative mt-8 flex flex-col items-center gap-2">

  {/* TOP ROW: Yoga + Drinking */}
  <div className="flex justify-between w-52">
    <img
      src="/yoga.png"
      alt=""
      className="w-12 h-12 rounded-full object-cover"
    />

    <img
      src="/drinking.png"
      alt=""
      className="w-12 h-12 rounded-full object-cover"
    />
  </div>

  {/* BOTTOM CENTER: Running */}
  <img
    src="/running.png"
    alt=""
    className="w-12 h-12 rounded-full object-cover"
  />

</div>

      
        <button className="mt-6 bg-[#133F30] text-white px-6 py-2 rounded-full text-sm hover:opacity-90 transition alata-font">
          Read More!
        </button>

      </div>

    </section>
  );
}