import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductDisplay(){
    return(
        <div className="">
          <div className="bg-[#133F30] h-5"></div>
        <div className="flex items-start gap-3 ml-4 mt-4">
  <div className="flex h-8 w-8 items-center justify-center rounded-full border">
    ←
  </div>

  <div>
    <h1 className="alata-font text-4xl font-bold">
      Wellvia Sleep Gummies
    </h1>

    <div className="flex flex-row items-center gap-4 mt-4 alata-font ">
      <p>
        Healthy sleep gummies to calm your mind and fall asleep faster
      </p>

      <button className="rounded-md bg-[#133F30] px-3 py-2 text-sm text-white alata-font flex items-center gap-1 whitespace-nowrap">
      <span>⭐</span>
      <span>4.4/5</span>
      </button>
    </div>
  </div>
</div>

<img src='/p2.png'
alt=''
className="w-full mt-4"/>

<div className="flex flex-col">

<div className="flex flex-row gap-3 mt-5">
<img src="/p2.png" alt="" className="w-20 h-20"/>
<img src="/back.png" alt="" className="w-20 h-20"/>
</div>

<div className="flex flex-row gap-3 mt-6">
    <h1 className="text-5xl">Rs.299</h1>
    <img src="/buy_get.png" alt="" className="w-30 h-10"/>
</div>

<div className="flex flex-row gap-3 mt-5">
 <div className="flex items-center">
              <button className="border px-2 py-1 text-lg">
                -
              </button>

              <div className="border-y px-3 py-1 text-lg">
                1
              </div>

              <button className="border px-2 py-1 text-lg">
                +
              </button>
            </div>

    <h2 className="text-lg">QTY</h2>
</div>

<div className="flex flex-row gap-1 mt-5">
    <img src="/destination.png" alt="" className="w-5 h-5"/>
    <p className="alata-font">Delivery Availability</p>
</div>

<div className="flex flex-row mt-5 gap-2">
     <input type="text" placeholder="Enter pincode" className="w-40 px-4 py-2 border border-black-400 rounded-lg"/>
    <button className="rounded-md bg-black px-3 py-2 text-sm text-white alata-font flex items-center gap-1 whitespace-nowrap">Check</button>
</div>

{/* //will do it later */}
<div className="flex flex-col gap-1 mt-5">

  <div className="flex flex-row gap-2">
    <img src="/car.png" alt="" className="w-5"/>
    <p>Free Shipping on orders above Rs 500</p>
  </div>

  <div className="flex flex-row gap-2">
    <img src="/card.png" alt="" className="w-5"/>
    <p>Refund and Replacement Policy</p>
  </div>
</div>


 <button className='mt-10 rounded-md bg-[#133F30] px-6 py-2 text-white alata-font'>Add to Cart</button>

<div className="mt-3 flex flex-col items-center gap-2">
  <div className="flex flex-row justify-between border border-black-400 rounded-md bg-[#F7F4EF] w-80 h-10  px-4 py-1">
    Description 
    <ChevronDown size={18}/>
  </div>
   <div className="flex flex-row justify-between border border-black-400 rounded-md bg-[#F7F4EF] w-80 h-10  px-4 py-1">
    How To Use?
    <ChevronDown size={18}/>
  </div>
   <div className="flex flex-row justify-between border border-black-400 rounded-md bg-[#F7F4EF] w-80 h-10  px-4 py-1">
    FAQs
    <ChevronDown size={18}/>
  </div>
</div>

<img src="sleep1.png" alt="" className="w-full mt-5"/>
<img src="sleep2.png" alt="" className="w-full mt-5"/>
<img src="sleep3.png" alt="" className="w-full mt-5"/>

<div className="flex flex-col items-center gap-1 mt-5">
  <h1 className="alata-font font-bold text-2xl">Customer Reviews</h1>
  <p>⭐ 4.6/5</p>
  <p className="font-light underline">(Based on 100 reviews)</p>
  <button className="rounded-md bg-[#133F30] text-white alata-font px-4 py-2">Write a review?</button>
</div>

<p className="alata-font mt-10">Pictures from our customers</p>
<div className="flex flex-row gap-1 mt-2 ">
  <div className="border border-black-300 w-20 h-20 rounded-md"></div>
  <div className="border border-black-300 w-20 h-20 rounded-md"></div>
  <div className="border border-black-300 w-20 h-20 rounded-md"></div>
  <div className="border border-black-300 w-20 h-20 rounded-md"></div>
  <Link className=" text-xs underline mt-8">+5 more</Link>

</div>

<div className="flex flex-row justify-between border border-black-400 rounded-md w-40 h-10  px-4 py-1 mt-5">
    most recent 
    <ChevronDown size={18}/>
  </div>

</div>


<div className="flex flex-col gap-5 mt-5">


  <div className="border border-gray-200 rounded-2xl shadow-sm p-5">
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gray-200" />
      <div>
        <p className="alata-font text-lg">Username</p>
        <div className="flex text-yellow-500 text-lg leading-none">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span className="text-gray-300">★</span>
        </div>
      </div>
    </div>
    <p className="alata-font mt-4 text-gray-700">
      No complicated wellness plans. Just one gummy and I'm
      good to go
    </p>
  </div>


  <div className="border border-gray-200 rounded-2xl shadow-sm p-5">
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gray-200" />
      <div>
        <p className="alata-font text-lg">Username</p>
        <div className="flex text-yellow-500 text-lg leading-none">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span className="text-gray-300">★</span>
        </div>
      </div>
    </div>
    <p className="alata-font mt-4 text-gray-700">
      No complicated wellness plans. Just one gummy and I'm
      good to go
    </p>
  </div>

</div>

<Link to="/" className="flex items-center gap-2 mt-10 alata-font text-lg">
  Home <span>→</span>
</Link>

<div className="flex flex-row gap-4 mt-4 items-start">
  <img
    src="/book.png"
    alt="Small Habits, Big Results"
    className="w-28 h-28 rounded-lg object-cover flex-shrink-0"
  />
  <div>
    <h3 className="alata-font font-bold text-xl leading-snug">
      Small Habits, Big Results: The Science of Daily Wellness
    </h3>
    <Link to="/" className="alata-font underline text-base">
      Read More
    </Link>
  </div>
</div>
</div>
    )
}