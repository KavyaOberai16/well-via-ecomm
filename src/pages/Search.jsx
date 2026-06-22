import { Search } from "lucide-react"

export default function SearchCategory(){
    return(
        <div className="">

            <div className="relative border px-2 py-2">
            <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />

          <input
          placeholder="Looking for immunity, beauty, or better sleep?"
          className="w-full max-w-md rounded-sm pl-8 pr-4 py-2"
          />
          </div>

          <div className="flex flex-row gap-5 mt-5">
            <div className="relative">
              <img src="/immunity.png"
              alt=""
              />
              <div className="absolute top-12 left-1.5 text-xs">Immunity</div>
            </div>
            <div className="relative">
              <img src="/gut.png"
              alt=""
              />
              <div className="absolute top-11 left-3 text-xs">Gut Health</div>
            </div>
            <div className="relative">
              <img src="/beauty.png"
              alt=""
              />
              <div className="absolute top-12 left-3 text-xs">Beauty</div>
            </div>
            <div className="relative">
              <img src="/sleep.png"
              alt=""
              />
              <div className="absolute top-12 left-3 text-xs">Sleep</div>
            </div>
            <div className="relative">
              <img src="/energy.png"
              alt=""
              />
              <div className="absolute top-12 left-3 text-xs">Energy</div>
            </div>
          </div>

           <h1 className="mt-10">Popular Searches</h1>

           <div className="flex flex-row justify-center mt-5 gap-5">
          <div className="flex flex-col items-center">
            <div className="border rounded-sm px-4 py-2 w-48 text-center alata-font">Immunity Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Beauty Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Ashwa-Ease Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Kids Gummies</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="border rounded-sm px-4 py-2 w-48 text-center alata-font">Gut Health Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Sleep Support Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Multivitamin Gummies</div>
            <div className="border rounded-sm px-4 py-2 mt-2 w-48 text-center alata-font">Women's Wellness Gummies</div>
          </div>

          </div>

          <div className="mt-4 flex justify-center mt-8">
          <button className="flex items-center gap-1 text-sm underline">
          View All Categories
          <span>→</span>
          </button>
          </div>
        </div>
    )
}