import { ArrowLeft, LocateFixed } from "lucide-react";


const FieldWrapper = ({ label, required, children, className = "" }) => (
  <div className={`relative ${className}`}>
    <span
      className="absolute -top-2.5 left-4 bg-white px-1.5 text-sm
                 text-[#1B3A4B] font-medium z-10"
    >
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </span>
    {children}
  </div>
);

const inputClass =
  "w-full border border-gray-300 rounded-xl px-4 py-4 text-base " +
  "text-[#1B3A4B] placeholder-gray-400 outline-none " +
  "focus:border-[#1B3A4B] transition-colors duration-200";

export default function Address() {
  return (
    <div className="">
        <div className="bg-[#133F30] h-5"></div>
    <div className="w-full min-h-screen bg-white px-5 pt-6 pb-12">

      <button
        className="w-11 h-11 rounded-full bg-white border border-gray-200
                   flex items-center justify-center mb-6
                   hover:bg-gray-50 transition-colors duration-200"
      >
        <ArrowLeft size={20} className="text-[#1B3A4B]" />
      </button>

      
      <div className="flex items-start justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A4B] leading-tight">
          Add Delivery Address
        </h1>

        <button
          className="flex items-center gap-2 border border-gray-300
                     rounded-xl px-3 py-2.5 text-sm text-gray-500
                     whitespace-nowrap hover:border-[#1B3A4B]
                     hover:text-[#1B3A4B] transition-colors duration-200"
        >
          <LocateFixed size={16} />
          Use my location
        </button>
      </div>

    
      <div className="flex flex-col gap-7">

        <FieldWrapper label="Full Name" required>
          <input type="text" className={inputClass} />
        </FieldWrapper>

        <FieldWrapper label="Mobile Number" required>
          <div className={`${inputClass} flex items-center gap-2`}>
            <span className="text-gray-500">+91</span>
            <span className="w-px h-5 bg-gray-300" />
            <input type="tel" className="flex-1 outline-none" />
          </div>
        </FieldWrapper>

        <FieldWrapper label="Address" required>
          <input
            type="text"
            placeholder="House No, Building, Street"
            className={inputClass}
          />
        </FieldWrapper>

        <FieldWrapper label="Locality">
          <input type="text" className={inputClass} />
        </FieldWrapper>

        <FieldWrapper label="Landmark (optional)">
          <input type="text" className={inputClass} />
        </FieldWrapper>


        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Pincode" required>
            <input type="text" className={inputClass} />
          </FieldWrapper>

          <FieldWrapper label="City" required>
            <input type="text" className={inputClass} />
          </FieldWrapper>
        </div>


      </div>
      <div className="flex items-center justify-center">
      <button className='mt-10 rounded-md bg-[#133F30] px-8 py-2 text-white alata-font'>Save</button>
      </div>


    </div>
    </div>
  );
}