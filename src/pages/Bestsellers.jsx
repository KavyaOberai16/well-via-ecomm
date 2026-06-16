import { ChevronDown } from "lucide-react";
import { Star } from 'lucide-react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';

const productsList = [
  { id: 1, name: "Ashwa-Ease Gummies", price: "₹349", img:'/bestseller1.png' },
  { id: 2, name: "Sleep Gummies", price: "₹349", img:'/bestseller3.png' },
  { id: 3, name: "Multi-Vitamin Gummies", price: "₹349", img:'/bestseller2.png' },
  { id: 4, name: "Meta-Gut Gummies", price: "₹349", img:'/bestseller4.png' }
];

export default function Bestsellers(){
    return(
        <div className="">

            <div className="bg-[#133F30] h-5"></div>

            <div className="relative pt-0">
               <img
            src='/bestsellers.png'
            alt=''
            className='w-full rounded'
            />
            <div className="absolute inset-0 flex items-center justify-center text-white z-10">
            <button className="text-lg">Home</button>
            <span className="mx-2">{'>'}</span>
            <button className="text-lg">Bestsellers</button>
</div>
            </div>

        
            <div className="grid grid-cols-[1fr_3fr_1fr] items-center gap-2 mt-5">
              <div className="flex items-center justify-between border px-3 py-2 max-w-fit">
          <span>Filter</span>
          <ChevronDown size={16} />
        </div>
        
             <div className="relative border px-2 py-2">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        
          <input
            placeholder="Search for products"
            className="w-full pl-8 outline-none"
          />
        </div>
        
        <div className="flex items-center border px-2 py-2 max-w-fit">
        
          <div className="flex gap-1 pr-2">
            <div className="w-1 h-5 bg-gray-400 rounded"></div>
            <div className="w-1 h-5 bg-gray-400 rounded"></div>
          </div>
        
        {/* line between 2 */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
          <div className="flex flex-col gap-1">
            <div className="w-4 h-1 bg-gray-400 rounded"></div>
            <div className="w-4 h-1 bg-gray-400 rounded"></div>
          </div>
        
        </div>
            </div>

            <h1 className="mt-5 text-center alata-font font-bold">Bestsellers</h1>
        
            <div className="grid grid-cols-2 gap-4 mt-4">
              {productsList.map((product)=>(
                <div key={product.id} className='border p-2'>

                    <div className="relative">
                  <img src= {product.img}
                  alt=''
                  className='w-full'
                  />
                  <div className="absolute left-0 top-0 bg-red-700 text-white alata-font">
                    BestSellers
                  </div>
                  </div>

                  <div className="flex mt-2">
                    <Star size={12} fill="currentColor" className="text-yellow-400"/>
                    <Star size={12} fill="currentColor" className="text-yellow-400"/>
                    <Star size={12} fill="currentColor" className="text-yellow-400"/>
                    <Star size={12} fill="currentColor" className="text-yellow-400"/>
                    <Star size={12} fill="currentColor" className="text-yellow-400"/>
                  </div>
                  <p>{product.name}</p>
                  <p>{product.price}</p>
                </div>
              ))}
            </div>
        
        
            </div>      
    )
}