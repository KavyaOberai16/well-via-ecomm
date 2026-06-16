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
    placeholder="Search for immunity, beauty, or better sleep?"
    className="w-full max-w-md rounded-sm px-4 py-2"
  />
</div>


        </div>
    )
}