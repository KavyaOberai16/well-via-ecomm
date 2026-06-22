import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingBag,
  Truck,
  ChevronDown,
  ChevronUp,
  Undo2,
  Banknote,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient.js';
import { Page } from '@/components/layout/Page.jsx';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useAuthStore } from '@/features/auth/store.js';
import RequestReturnModal from '@/features/returns/components/RequestReturnModal.jsx';
import { useMyReturns } from '@/features/returns/hooks.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const RETURN_STATUS_TONE = {
  requested: 'bg-warning/15 text-warning',
  approved: 'bg-accent/15 text-accent',
  rejected: 'bg-danger/15 text-danger',
  picked_up: 'bg-blue-500/15 text-blue-400',
  received: 'bg-blue-500/15 text-blue-400',
  refunded: 'bg-success/15 text-success',
  cancelled: 'bg-ink-tertiary/15 text-ink-tertiary',
};

export default function OrdersPage() {
 return(
  <div className="">

    <div className="bg-[#133F30] h-5"></div>
      <div className="flex items-center gap-3 ml-4 mt-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border">
       ←
      </div>

  <h1 className="alata-font text-lg font-bold">
    My Orders
  </h1>
</div>


{/* 1st card */}
  <div className=" relative mx-4 mt-6 flex justify-between rounded-lg border border-[#F5D05A] p-4 shadow-sm bg-white">

  <div className="absolute -top-3 left-3 rounded-full bg-[#F5D05A] px-3 py-1 text-xs text-white">
  Out for Delivery
</div>
  {/* LEFT SIDE */}
  <div>
    <p className="text-sm text-gray-500 alata-font mt-1">
      Track Order ←
    </p>

    <div className="flex gap-4">
      <div className="flex flex-col">
        <p className='text-xs'>Total Amount</p>
        <p className='text-xs'>Items</p>
      </div>

      <div className="flex flex-col">
        <p className='text-xs'>: ₹349</p>
        <p className='text-xs'>: 4</p>
      </div>
    </div>
  </div>

 <div className="flex flex-col items-end">
  <p className="mb-2 text-xs text-gray-500">
    Delivery expected by 15 Jun
  </p>

  <div className="flex">
    <img src="/p4.png" className="h-20 w-20" />
    <img src="/p7.png" className="h-20 w-20 -ml-4" />
    <img src="/p8.png" className="h-20 w-20 -ml-4" />
  </div>
</div>

</div>

{/* 2nd card */}
<div className="relative mx-4 mt-6 flex justify-between rounded-lg border border-[#269972] p-4 shadow-sm bg-white">

<div className="absolute -top-3 left-3 flex ">
  <div className="rounded-full bg-[#269972] px-3 py-1 text-xs text-white">
    Order Delivered
  </div>

  <div className="rounded-full bg-[#133F30] px-3 py-1 text-xs text-white">
    Reorder in 1 Tap
  </div>
</div>

  <div>
    <p className="text-sm text-gray-500 alata-font">
      Track Order ←
    </p>

    <div className="flex gap-4">
      <div className="flex flex-col">
        <p className='text-xs'>Total Amount</p>
        <p className='text-xs'>Items</p>
      </div>

      <div className="flex flex-col">
        <p className='text-xs'>: ₹659</p>
        <p className='text-xs'>: 4</p>
      </div>
    </div>
  </div>

<div className="flex flex-col items-end">
  <p className="mb-2 text-xs text-gray-500">
    Delivered by 2 June
  </p>

  <div className="flex">
    <img src="/p4.png" className="h-20 w-20" />
    <img src="/p7.png" className="h-20 w-20 -ml-4" />
    <img src="/p8.png" className="h-20 w-20 -ml-4" />
  </div>
</div>

</div>

{/* 3rd card */}
<div className="relative mx-4 mt-6 flex justify-between rounded-lg border border-[#269972] p-4 shadow-sm bg-white">

<div className="absolute -top-3 left-3 flex ">
  <div className="rounded-full bg-[#269972] px-3 py-1 text-xs text-white">
    Order Delivered
  </div>

  <div className="rounded-full bg-[#133F30] px-3 py-1 text-xs text-white">
    Reorder in 1 Tap
  </div>
</div>
  <div>
    <p className="text-sm text-gray-500 alata-font">
      Track Order ←
    </p>

    <div className="flex gap-4">
      <div className="flex flex-col">
        <p className='text-xs'>Total Amount</p>
        <p className='text-xs'>Items</p>
      </div>

      <div className="flex flex-col">
        <p className='text-xs'>: ₹860</p>
        <p className='text-xs'>: 4</p>
      </div>
    </div>
  </div>

 <div className="flex flex-col items-end">
  <p className="mb-2 text-xs text-gray-500">
    Delivered by 28 May
  </p>

  <div className="flex">
    <img src="/p4.png" className="h-20 w-20" />
    <img src="/p7.png" className="h-20 w-20 -ml-4" />
    <img src="/p8.png" className="h-20 w-20 -ml-4" />
  </div>
</div>

</div>




  </div>
  );
}

// function formatEventTime(iso) {
//   if (!iso) return '';
//   return new Date(iso).toLocaleString(undefined, {
//     month: 'short',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// }

// function humanize(status) {
//   return (status || '').replace(/_/g, ' ');
// }

// const EVENT_TONES = {
//   delivered: 'text-success',
//   out_for_delivery: 'text-accent',
//   in_transit: 'text-blue-400',
//   picked_up: 'text-blue-400',
//   created: 'text-ink-tertiary',
//   returned: 'text-warning',
//   failed: 'text-warning',
//   cancelled: 'text-danger',
// };

// function TrackingDisclosure({ order }) {
//   const [open, setOpen] = useState(false);
//   if (!order.shipping_awb) return null;
//   const events = order.tracking_events || [];

//   return (
//     <div className="mt-3 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2">
//       <button
//         type="button"
//         onClick={() => setOpen((v) => !v)}
//         className="flex w-full items-center justify-between gap-2 text-left"
//       >
//         <span className="flex items-center gap-1.5 text-xs">
//           <Truck className="size-3.5 text-ink-tertiary" aria-hidden="true" />
//           <span className="text-ink-secondary">Tracking</span>
//           <span className="font-mono text-[10px] text-ink-tertiary">
//             {order.shipping_awb}
//           </span>
//         </span>
//         {open ? (
//           <ChevronUp className="size-3.5 text-ink-tertiary" />
//         ) : (
//           <ChevronDown className="size-3.5 text-ink-tertiary" />
//         )}
//       </button>
//       {open && (
//         <div className="mt-2">
//           {events.length === 0 ? (
//             <p className="text-xs text-ink-tertiary">
//               No updates yet from the carrier.
//             </p>
//           ) : (
//             <ol className="flex flex-col gap-1.5">
//               {[...events]
//                 .sort((a, b) =>
//                   (b.occurred_at || '').localeCompare(a.occurred_at || ''),
//                 )
//                 .map((e, i) => (
//                   <li
//                     key={`${e.status}-${e.occurred_at}-${i}`}
//                     className="text-xs"
//                   >
//                     <span
//                       className={`font-semibold capitalize ${EVENT_TONES[e.status] || 'text-ink-secondary'}`}
//                     >
//                       {humanize(e.status)}
//                     </span>
//                     <span className="text-ink-tertiary">
//                       {' · '}
//                       {formatEventTime(e.occurred_at)}
//                       {e.location ? ` · ${e.location}` : ''}
//                     </span>
//                   </li>
//                 ))}
//             </ol>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// const STATUS_TONES = {
//   paid: 'bg-success/15 text-success',
//   pending: 'bg-warning/15 text-warning',
//   shipped: 'bg-accent/15 text-accent',
//   delivered: 'bg-success/15 text-success',
//   cancelled: 'bg-danger/15 text-danger',
//   refunded: 'bg-ink-tertiary/15 text-ink-tertiary',
// };

// function useMyOrders() {
//   const token = useAuthStore((s) => s.accessToken);
//   return useQuery({
//     queryKey: ['orders'],
//     queryFn: () => apiClient.get('/orders').then((r) => r.data),
//     enabled: !!token,
//     retry: false,
//   });
// }

// function ReturnsSummary() {
//   const { data: returns, isLoading } = useMyReturns();
//   if (isLoading) return null;
//   if (!returns || returns.length === 0) return null;
//   return (
//     <Card className="mt-8 p-5">
//       <h2 className="flex items-center gap-2 text-h3 text-ink-primary">
//         <Undo2 className="size-4 text-accent" aria-hidden="true" /> Your returns
//       </h2>
//       <ul className="mt-3 flex flex-col gap-2">
//         {returns.map((r) => (
//           <li
//             key={r.id}
//             className="flex flex-col gap-1 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
//           >
//             <div>
//               <p className="text-ink-primary">
//                 Return #{r.id} · Order #{r.order_id}
//               </p>
//               <p className="text-[11px] text-ink-tertiary">
//                 {r.reason.replace(/_/g, ' ')} · requested{' '}
//                 {new Date(r.requested_at).toLocaleDateString()}
//               </p>
//             </div>
//             <span
//               className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
//                 RETURN_STATUS_TONE[r.status] || 'bg-fill text-ink-tertiary'
//               }`}
//             >
//               {r.status.replace(/_/g, ' ')}
//             </span>
//           </li>
//         ))}
//       </ul>
//     </Card>
//   );
// }


