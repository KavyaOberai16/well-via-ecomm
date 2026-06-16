export default function Emptycart(){
    return(
        <div className="">
            <div className="bg-[#133F30] h-5"></div>
            <h1 className="text-center mt-10 font-bold alata-font">I'm Empty Now</h1>
            <div className="relative flex items-center justify-center">
                <img
                src='/emptyCart.png'
                />
            </div>
            <div className="mt-3 flex justify-center">
            <p className="w-40 text-center leading-tight">
            I've got plenty of room for your wellness picks. Ready when you are
           </p>
          </div>
                <div className="flex justify-center mt-4 mb-32">
                <button className="rounded bg-[#133F30] px-4 py-2 text-white">
                Start Exploring
               </button>
              </div>
              </div>
    )
}