import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-200 text-center p-4 mt-8">
      <div className="container mx-auto">
        © {new Date().getFullYear()} E-Commerce App. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;