"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const newItems = [
  {
    title: "Bamboo Cutlery",
    price: "₹450",
    href: "/products?q=bamboo+cutlery",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-7Ex2MklfYOaKXM5hlc3XLs2BboyQRhZg0r7eDo_O3NsWeqr9yZw85TfBOTx36_JR8bn4N72L1PS3bW_EUZkQ-dq5cw8kQspu6bcdeIj-jHicU-3-NYmTDknXwv7Bd1XreKGVyHnNOfZUW81BH2Iw-hA0vFqRXI9zB3K1TaA1BgYWRkl13r33l5UVUksLwPx5jkX-fsnwYroK3ut1yIgt03WAsZ4H4PKpXcHugN3-gK0KF3Y-rY9h3g",
  },
  {
    title: "Organic Cotton Tote",
    price: "₹299",
    href: "/products?q=cotton+tote",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuABYjKCWGD6F44FU1Xd_U6hGiH5U94Xr7qqtVIKrQrC2JfNJOPVGzIvY7Ic2ftCv9m88YbfPDnW7u_bdEKy7GOBB2GdTBxe1km9lxc6WwvF6tH_87HDAz3W0ArIQoDh1KVs3quuFBA8NdHuyhN84GL3OsQIo1WzMHnG4VC_DRdEO_hzCHHDgnrFjfgZGpSFoBZ6_4EOD8DASVUghz_vuqHB2xG9qi07sN3FbceJK7O770KH-klcvUDmlw",
  },
  {
    title: "Recycled Glass Vase",
    price: "₹1,100",
    href: "/products?q=glass+vase",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnWungAmi2cGXzmqN3lGqzOeArCQBbIaMrwED4FfC-mQI3PokiXOuHkUKtA2tSn5v69KmeL-EPewVxpYYKb6ogUPXgSWknoxIl22n5ux5CrKGm8IKJb_KGJbO3Axy48ZY0Ll8P-reJb_DQavb51W8kTrHuszN2Y-hAZ-63FznUaXjrqF3BQByVshZjZg-PI01gmR4IpKDqEdZ1K4kfnE41VDTYEUWy0LPK2u2_Os5vRFk10lJcbVOEpA",
  },
];

export default function HomeNewAndNoticed() {
  return (
    <section className="mb-6 md:mb-12" data-purpose="new-and-noticed">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="mb-4 md:mb-6">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900">New &amp; Noticed</h3>
        </div>

        {/* Featured Brand Banner */}
        <Link
          href="/sellers/ecolife"
          className="mb-6 md:mb-8 relative h-48 md:h-[400px] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer block"
        >
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1c1E5NGHjQ0B6esPsQMT_HPG74JELUoG66hGyBysJ3QHZT-Y3SgnL9WRrgZ2iur4fwIbDy-47FKWAAAbd2C55UTuH38K0DuLJoJzIB8OU_B406yR731h8H2fIjdF2oZa89cL3--Nnu1SHJomg1bGRQFE_JZV7niO9Uzo-uaI4lAMPxYCGrvrln9bd6ut17qvPLRqLoGjkJqy238OOLBcjThzvVCoYIeOiwEKlazmeupd7iTBC_zMVPw"
            alt="EcoLife Feature"
            fill
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-10">
            <span className="text-white text-xs md:text-sm font-bold mb-1 md:mb-2 tracking-wider">FEATURED BRAND</span>
            <h4 className="text-white text-xl md:text-4xl font-bold mb-1 md:mb-3">EcoLife Sustainable Living</h4>
            <p className="text-gray-200 text-xs md:text-base max-w-2xl">
              New arrivals for a greener home. Explore our latest collection of eco-friendly and sustainably sourced everyday items.
            </p>
          </div>
        </Link>

        {/* Mini New Items Grid */}
        <div className="flex overflow-x-auto hide-scrollbar gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:gap-6 md:overflow-visible">
          {newItems.map((item) => (
            <Link key={item.title} href={item.href} className="min-w-[120px] md:min-w-0 flex flex-col group cursor-pointer block">
              <div className="relative h-32 md:h-48 bg-gray-100 rounded-lg md:rounded-xl overflow-hidden mb-2 md:mb-3">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-800 truncate group-hover:text-[#004F50] transition-colors">
                {item.title}
              </span>
              <span className="text-xs md:text-sm text-[#004b49] font-bold">{item.price}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
