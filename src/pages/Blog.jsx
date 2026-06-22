export default function Blog() {

  const blogs = [
    {
      id: 1,
      image: "/yogurt.png",
      title: "Why You Might Still Have Nutritional Gaps - Even With a Healthy Diet",
      date: "28 May 2026",
    },
    {
      id: 2,
      image: "/book.png",
      title: "Small Habits, Big Results: The Science of Daily Wellness",
      date: "01 June 2026",
    },
    {
      id: 3,
      image: "/stomach.png",
      title: "Gut Health: The Foundation of Everyday Wellness",
      date: "10 June 2026",
    },
  ];

  return (
    <div>
      <div className="bg-[#133F30] h-5"></div>

      <div className="mt-8">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="mx-4 mt-6 flex gap-4 rounded-lg border p-4 shadow-sm"
          >
            <img
              src={blog.image}
              alt=""
              className="h-24 w-24 rounded-md object-cover"
            />

            <div className="flex flex-col justify-between">
              <div>
                <h1 className="alata-font font-bold">
                  {blog.title}
                </h1>

                <p className="mt-2 alata-font text-sm text-gray-500">
                  {blog.date}
                </p>
              </div>

              <button className="mt-3 w-fit rounded bg-[#133F30] px-4 py-2 text-white alata-font">
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}