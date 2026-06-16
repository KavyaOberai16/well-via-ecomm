export default function WellnessCombo() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-4 mt-15 mb-15">
      <div className="flex items-start justify-between">

        {/* Left Side */}
        <div className="max-w-[150px]">
          <h2 className="font-semibold text-lg leading-tight mt-10 josephine-slab-font">
            the piece that brings it all together
          </h2>

          <div className="mt-2 text-sm leading-relaxed gabriela-font">
  <p className="inline border-b border-gray-400 pb-[2px]">
    "sometimes, the smallest things make the biggest difference"
  </p>
</div>
        </div>

        {/* Right Side */}
        <img
          src="/wellviaBerry.png"
          alt=""
          className="w-60 mt-5 h-auto object-contain flex-shrink-0"
        />

      </div>

      <div className="relative">

      <div className="mt-5 max-w-[150px] mx-auto flex flex-col items-center text-center alata-font">
      <p>Science backed supplements for everyday</p>

      <button className="mt-2 rounded-full bg-[#133F30] px-4 py-2 text-white">
       Shop Now!
      </button>
      </div>


         <div className="flex justify-between items-center mt-2">
  <img
    src="/Downarrow.png"
    alt=""
    className="w-40"
  />

      <div className="flex flex-col items-center">
  <div className="h-24 overflow-hidden">
    <img
      src="/question.png"
      alt=""
      className="w-40 block"
    />
  </div>

  <p className="mt-2 josephine-slab-font inline border-b border-gray-400 pb-[2px]">
  together with what?
</p>
</div>
</div>

   <div className="flex justify-between items-center mt-2">
        <img
        src="/puzzles.png"
        alt=""
        className="left-0 bottom-0 w-60"
        />

        <div className="flex flex-col items-center inter-font">
            <p>Healthy Habits</p>
            <img
            src="/Up.png"
            alt=""
            />
            <p>Daily routine</p>
             <img
            src="/Down.png"
            alt=""
            />
            <p>Choices you make</p>
            </div>
            </div>

        <div className="flex justify-between items-center leading tight mt-2 josephine-slab-font">
            <p className="underline underline-offset-4">
  "Every healthy routine has its pieces. This is one of them"
</p>
            <img
            src="/women.png"
            alt=""
            className="w-60 mt-5 h-auto object-contain flex-shrink-0"
            />
        </div>




        </div>
      </div>


    
  );
}