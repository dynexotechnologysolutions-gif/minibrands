import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-tertiary mt-auto">
      <div className="w-full py-xxl px-base lg:px-xl grid grid-cols-2 md:grid-cols-5 gap-lg max-w-container-max mx-auto bg-tertiary">
        <div className="col-span-2 md:col-span-1 flex flex-col font-headline-sm">
          <span className="text-headline-sm font-bold text-on-tertiary mb-md">MINIBRANDS</span>
        </div>
        <div className="flex flex-col gap-sm">
          <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">About Us</a>
        </div>
        <div className="flex flex-col gap-sm">
          <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Help Center</a>
        </div>
        <div className="flex flex-col gap-sm">
          <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Become a Seller</a>
          <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Policies</a>
        </div>
        <div className="flex flex-col gap-sm">
          <a className="text-body-sm font-body-sm text-on-secondary-fixed-variant hover:text-accent-yellow transition-colors" href="#">Contact Us</a>
        </div>
        <div className="col-span-2 md:col-span-5 mt-lg pt-lg border-t border-on-secondary-fixed-variant/20 flex flex-col md:flex-row items-center justify-between">
          <span className="text-body-sm font-body-sm text-on-secondary-fixed-variant">© {new Date().getFullYear()} MINIBRANDS Marketplace. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
