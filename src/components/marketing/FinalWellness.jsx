export default function FinalWellness() {
  return (
    <div className="mt-16">

     <div className="flex justify-center">
  <h1 className="text-2xl font-semibold leading-tight max-w-[220px] mb-6 alata-font text-center">
    Delicious, Healthy gummies for a better you!
  </h1>
</div>

      <div className="bg-white rounded-3xl border border-gray-200 p-4">
        <img
          src="/finalPics.png"
          alt=""
          className="w-full rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 alata-font">

        <div className="rounded-xl border border-gray-200 p-3 text-center text-sm">
          Clean Ingredients
        </div>

        <div className="rounded-xl border border-gray-200 p-3 text-center text-sm">
          Result Based Ingredients
        </div>

        <div className="rounded-xl border border-gray-200 p-3 text-center text-sm">
          Non-Habit Forming
        </div>

        <div className="rounded-xl border border-gray-200 p-3 text-center text-sm">
          Clean Ingredients
        </div>

      </div>

    </div>
  );
}