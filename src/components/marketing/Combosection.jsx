export default function ComboSection() {

  const combos = [
    {
      id: 1,
      img: "/Pair 1.png",
      alt: "Look good feel good combo",
    },
    {
      id: 2,
      img: "/Pair 2.png",
      alt: "Gut and Guard combo",
    },
  ];

  return (
    <section className="mt-10 px-4 sm:px-6 max-w-content mx-auto">

      <div className="flex flex-col items-center text-center gap-2 mb-5 alata-font">

        <h2 className="text-lg sm:text-xl font-semibold">
          Explore Our Collection
        </h2>

        <button className="px-4 py-1.5 border border-black rounded-full text-sm hover:bg-black hover:text-white transition">
          Explore All
        </button>

      </div>

      <div className="flex flex-col gap-4">

        {combos.map((c) => (
          <img
            key={c.id}
            src={c.img}
            alt={c.alt}
            className="w-full rounded-xl object-contain"
          />
        ))}

      </div>

    </section>
  );
}