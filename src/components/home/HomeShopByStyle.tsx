"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const styles = [
  {
    title: "Everyday Essentials",
    href: "/products?style=essentials",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB55giR7Mo3xttl7ut6J-ZhmcusYkyDHXA6BbrvK-n407V252ZOpSZtR4LWptzmDD4TJM5Tp1mA-AfBbrwoilhTIv1JuGhFZB1qX4HWo9Mnc1f2JmiGwO06hFlCvJuaLDJn3CCWTO_26NHCcGiii_VtdXDCBlCagE6YPIMYkO0XDCy-_qXjRLWE1R30qtGFrPG7DqbSCgsskrobSXPrlBvGi4fAYbbD-MVWC4DB5OwVJWhdaFxuSTZDCg",
  },
  {
    title: "Streetwear",
    href: "/products?style=streetwear",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAK2KrZWZYvJQvuR5N5XpV7bY_qZWNK3j0rIZ02nJnCgcGOONOky3KqNtu7Dwc8N_-pBUkD3ypyo7lhXbfHZ2lP5QCshbVpzJGT8ARA3b4pwnq4o6Eqaf0FKn259SIGtREyuXDBAFUPJ5a_NM0ezURCqRe-L_XLn8HDJJBMIfiEo45LCwpTZ2BGKRGt1u1SB1iDFcuXNkDkevbHM-7JnYGzGYz-WvKUl8w4CKLqe_PtjBh0crpRkb1D_Q",
  },
  {
    title: "Minimal",
    href: "/products?style=minimal",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhj1xVz1E3Fa2KTDzCHCUspRi69yDQ5xz3smMjDGE8JrXT18HrKek9URmgG0ptVwQMkfHCC9UQQ3wxzRChSRv3jQBBjlvB6eq0k4xax9S9JYYuWLUvsoWYoNmDKqBvi-0At-5E34SlKrrFkhR54pJC8Aolv4r6C__MSsocpQdxVsumLPJag-5heCyZdj4S5pJJGKxJGmXcUC-vy4QzPce0OapGBUsrWzK5ZAH6eVS_7EtEPSGOlaLmNA",
  },
  {
    title: "Party Wear",
    href: "/products?style=partywear",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBVWHxteExzPqWZyWatito4xNYFvDasvznY45U__jX7yp07hBv5_6JIWKmKMJhdxWSIHJDOWFgWMsvjExzyntQe0n10NEvjwhQaQtdHhLxcSQw-UIO0fMdrXCm3ImGu9WmWgAejgo3Q4oGHyP_FACJ3c1w1TdGEBR0qoIEI-t2UxwAzGzpBgpO8-4JoVxbeOo9EMef2pYLQ9UwTHEuhAp5n-cR9P046-r1-pwgbAfCXTJURVuhyHrU3Q",
  },
];

export default function HomeShopByStyle() {
  return (
    <section className="mb-6 md:mb-12" data-purpose="shop-by-style">
      <div className="max-w-[1280px] mx-auto">
        <div className="px-4 md:px-8 mb-4 md:mb-6">
          <p className="text-[10px] md:text-xs font-bold text-[#004b49] uppercase tracking-wider mb-0.5 md:mb-1">
            Curated For You
          </p>
          <h3 className="text-lg md:text-2xl font-bold text-gray-900">Shop by Style</h3>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 md:px-8 pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:overflow-visible">
          {styles.map((style) => (
            <Link
              key={style.title}
              href={style.href}
              className="relative min-w-[160px] md:min-w-0 h-48 md:h-64 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 group cursor-pointer block"
            >
              <Image
                src={style.img}
                alt={style.title}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 md:p-5">
                <span className="text-white font-bold text-sm md:text-lg">{style.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
