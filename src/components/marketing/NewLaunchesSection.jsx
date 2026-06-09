export default function NewLaunchesSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold">
          New Launches
        </h2>

        <button className="mt-3 rounded-full border-2 border-black px-5 py-2 text-sm">
          Explore All
        </button>
      </div>
      <div className="relative mt-6 w-full">

  <img
    src="/newLaunches.png"
    alt="Wellness Collection"
    className="w-full"
  />

  <button
    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#133F30] px-6 py-3 text-white"
  >
    Shop Now!
  </button>

</div>
    </section>
  );
}