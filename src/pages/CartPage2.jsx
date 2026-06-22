export default function CartPage2() {

const products = [
{id: 1, image: "/p2.png", title: "Sleep Gummies", info: "Pack of 30"},
{id: 2, image: "/p5.png", title: "Multivitamin Gummies", info: "Pack of 30"}
];

return ( 
<div>

  {/* Savings Banner */}
  <div className="flex items-center justify-center gap-2 bg-[#133F30] px-4 py-2 text-white">
    <img
      src="/percent.png"
      alt=""
      className="h-5 w-5"
    />
    <p>You save ₹109 on this order!</p>
  </div>

  {/* Cart Products */}
  <div className="mt-8">
    {products.map((product) => (
      <div
        key={product.id}
        className="mx-4 mt-6 flex gap-4 rounded-lg border p-4 shadow-sm bg-white"
      >
        <img
          src={product.image}
          alt={product.title}
          className="h-28 w-28 object-contain"
        />

        <div className="flex flex-1 flex-col">
          <p className="font-semibold alata-font">
            {product.title}
          </p>

          <p className="text-sm text-gray-500 alata-font">
            {product.info}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <p className="rounded bg-[#133F30] px-4 py-2 text-white alata-font">
              ₹349
            </p>

            <div className="flex items-center">
              <button className="border px-2 py-1">
                -
              </button>

              <div className="border-y px-3 py-1">
                1
              </div>

              <button className="border px-2 py-1">
                +
              </button>
            </div>

            <button className="text-red-600">
              🗑
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Coupons Section */}
  <div className="mx-4 mt-6 rounded-lg border p-4 shadow-sm bg-white">

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img
          src="/percent.png"
          alt=""
          className="h-5 w-5"
        />
        <p className="font-semibold">
          Coupons & Offers
        </p>
      </div>

      <button className="text-sm text-[#133F30] underline">
        Offers
      </button>
    </div>

    <p className="mt-2 text-sm text-gray-500">
      Apply a coupon to save more on your order
    </p>

    <div className="mt-4 flex">
      <input
        type="text"
        placeholder="Enter coupon code"
        className="flex-1 rounded-l border px-3 py-2 outline-none"
      />

      <button className="rounded-r bg-[#A38732] px-4 py-2 text-white">
        Apply Code
      </button>
    </div>

  </div>


{/* Delivery */}
  <div className="mx-4 mt-6 rounded-lg border p-4 shadow-sm bg-white">

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img
          src="/destination.png"
          alt=""
          className="h-5 w-5"
        />
        <p className="font-semibold">
          Delivery for pincode 110057
        </p>
      </div>

      <button className="text-sm text-[#133F30] underline">
        Change
      </button>
    </div>

    <p className="mt-2 text-sm text-gray-500">
      Yay! Your pincode is eligible for delivery
    </p>
    <h2 className="text-[#133F30] mt-2">Delivery by 25 June, Wednesday</h2>

  </div>

  <img src="banklogo.png"
  alt=""
  className="mt-10 w-full"
  />

  <div className="mt-10 rounded-lg border p-4 shadow-sm bg-white flex flex-row justify-between">
    <div className="flex flex-col">
        ₹660
    <button className="text-sm underline text-[#133F30]">
        View Price Details
    </button>
    </div>
    <div className="">
        <button className="rounded bg-[#133F30] px-4 py-2 text-white alata-font">Proceed to Checkout</button>
    </div>
  </div>

</div>



);
}
