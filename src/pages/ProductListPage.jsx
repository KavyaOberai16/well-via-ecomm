import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, PackageX, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useCategories } from '@/features/categories/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { ChevronDown } from "lucide-react";
import { Star } from 'lucide-react';

const PAGE_SIZE = 12;

export default function ProductListPage() {
  // const [searchParams] = useSearchParams();
  // // The catalog can be filtered by category via either URL shape:
  // //   ?category_id=<id>   (used by product-detail "Visit the X store" links)
  // //   ?category=<slug>    (used by the homepage category circles)
  // const categoryIdParam = searchParams.get('category_id');
  // const categorySlug = searchParams.get('category');

  // const { data: categories = [] } = useCategories();

  // const activeCategory = useMemo(() => {
  //   if (categoryIdParam) {
  //     const id = Number(categoryIdParam);
  //     return categories.find((c) => c.id === id) || (Number.isFinite(id) ? { id, name: null } : null);
  //   }
  //   if (categorySlug) {
  //     return categories.find((c) => c.slug === categorySlug) || null;
  //   }
  //   return null;
  // }, [categoryIdParam, categorySlug, categories]);

  // const categoryId = activeCategory?.id;

  // const [search, setSearch] = useState('');
  // const [query, setQuery] = useState('');
  // const [page, setPage] = useState(1);

  // // Debounce the search input so we do not refetch on every keystroke.
  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     setQuery(search.trim());
  //     setPage(1);
  //   }, 300);
  //   return () => clearTimeout(t);
  // }, [search]);

  // // Reset to the first page whenever the active category changes.
  // useEffect(() => {
  //   setPage(1);
  // }, [categoryId, categorySlug]);

  // const { data, isLoading, isError, refetch } = useProducts({
  //   q: query || undefined,
  //   category_id: categoryId,
  //   page,
  //   page_size: PAGE_SIZE,
  // });
  // const addToCart = useAddToCart();

  // const products = data?.items ?? [];
  // const total = data?.total ?? 0;
  // const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // const isFiltered = !!(categoryIdParam || categorySlug);
  // const heading = activeCategory?.name || (isFiltered ? 'Category' : 'Shop');


  const productsList = [
  { id: 1, name: "Ashwa-Ease Gummies", price: "₹349", img:'/p1.png' },
  { id: 2, name: "Sleep Gummies", price: "₹349", img:'/p2.png' },
  { id: 3, name: "Her-Wellness Gummies", price: "₹349", img:'/p3.png' },
  { id: 4, name: "Immunity Gummies", price: "₹349", img:'/p4.png' },
  { id: 5, name: "Multi-Vitamin Gummies", price: "₹349", img:'/p5.png' },
  { id: 6, name: "Beauty Boost Gummies", price: "₹349", img:'/p6.png' },
  { id: 7, name: "Meta-Gut Gummies", price: "₹349", img:'/p7.png' },
  {id: 8, name:"Core Omega Gummies ", price: "₹349", img: '/p8.png'}
];

  return (
    <div className="">
    <div className="bg-[#133F30] h-5"></div>
    <div className="relative pt-0">
       <img
    src='/allProducts.png'
    alt=''
    className='w-full rounded'
    />
    <div className="absolute top-3 left-2">
  <h1 className="text-xs alata-font text-[#133F30]">
    Wellness, your way
  </h1>

  <p className="mt-1 text-[8px] leading-tight w-24">
    From better sleep to daily immunity, discover gummies crafted for every goal
  </p>

  <button className="mt-1 rounded-full bg-[#133F30] px-2 py-1 text-[8px] text-white">
    Shop All Products
  </button>
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

    <div className="grid grid-cols-2 gap-4 mt-4">
      {productsList.map((product)=>(
        <div key={product.id} className='border p-2'>
          <img src= {product.img}
          alt=''
          className='w-full'
          />
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
    
    
  );
}
