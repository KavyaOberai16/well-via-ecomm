import React from 'react';

export default function Products() {

  const products = [
    {
      id: 1,
      name: "Multivitamin Gummies",
      price: 349,
      img: "/Blue.png",
    },
    {
      id: 2,
      name: "Beauty Boost Gummies",
      price: 399,
      img: "/Purple.png",
    },
    {
      id: 3,
      name: "Neta Gut Gummies",
      price: 299,
      img: "/Green.png",
    },
    {
      id: 4,
      name: "Omega Gummies",
      price: 499,
      img: "/Olive.png",
    },
  ];

  const ProductCard = ({ name, price, img }) => {
    return (
      <div className="min-w-[160px] sm:min-w-[180px] border rounded-lg p-3 bg-white relative flex-shrink-0">

        {/* wishlist */}
        <button className="absolute top-2 right-2 text-gray-500 text-lg">
          ♡
        </button>

        {/* image */}
        <div className="flex justify-center">
          <img
            src={img}
            alt={name}
            className="h-24 object-contain"
          />
        </div>

        {/* name */}
        <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">
          {name}
        </p>

        {/* price */}
        <p className="text-sm text-gray-600">
          ₹{price}
        </p>

        {/* button */}
        <button className="mt-3 w-full bg-[#133F30] text-white py-2 rounded-md text-sm">
          Add to cart 🛒
        </button>

      </div>
    );
  };

  return (
    <section className="mt-10 px-4 sm:px-6 max-w-content mx-auto">

      {/* HEADER */}
      <div className="flex flex-col items-center text-center gap-2 mb-4 alata-font">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Find Your Wellness Match!
        </h2>

        <button className="px-4 py-1.5 border border-black rounded-full text-sm hover:bg-black hover:text-white transition">
          Explore All
        </button>
      </div>

      {/* CAROUSEL */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 alata-font">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            price={product.price}
            img={product.img}
          />
        ))}
      </div>

    </section>
  );
}