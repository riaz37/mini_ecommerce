import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">About Us</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
          <div className="md:flex">
            <div className="md:shrink-0">
              <div className="h-48 w-full bg-gradient-to-r from-blue-500 to-indigo-600 md:h-full md:w-48"></div>
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                Our Mission
              </div>
              <p className="mt-2 text-gray-600">
                At E-Commerce, our mission is to provide customers with
                high-quality products at affordable prices. We believe in
                creating a seamless shopping experience that makes finding and
                purchasing the items you need simple and enjoyable.
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <h2>Our Story</h2>
          <p>
            Founded in 2023, E-Commerce began with a simple idea: to create an
            online marketplace that puts customers first. What started as a
            small operation has grown into a comprehensive e-commerce platform
            offering thousands of products across multiple categories.
          </p>

          <p>
            Our team is made up of passionate individuals who are dedicated to
            improving the online shopping experience. We work tirelessly to
            source quality products, develop user-friendly features, and provide
            exceptional customer service.
          </p>

          <h2>Our Values</h2>
          <ul>
            <li>
              <strong>Quality:</strong> We carefully select each product to
              ensure it meets our high standards.
            </li>
            <li>
              <strong>Affordability:</strong> We believe great products
              shouldn&apos;t break the bank.
            </li>
            <li>
              <strong>Customer Service:</strong> Your satisfaction is our top
              priority.
            </li>
            <li>
              <strong>Innovation:</strong> We&apos;re constantly improving our
              platform to better serve you.
            </li>
            <li>
              <strong>Sustainability:</strong> We&apos;re committed to reducing
              our environmental impact.
            </li>
          </ul>

          <h2>Our Team</h2>
          <p>
            Our diverse team brings together expertise in retail, technology,
            logistics, and customer service. We&apos;re united by our commitment
            to creating the best possible shopping experience for our customers.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Quality Products</h3>
              <p className="text-gray-600">
                Carefully selected items that meet our high standards for
                quality and durability.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Competitive Pricing
              </h3>
              <p className="text-gray-600">
                Great value without compromising on quality or service.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-blue-600 mb-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Customer Support</h3>
              <p className="text-gray-600">
                Dedicated team ready to assist you with any questions or
                concerns.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
