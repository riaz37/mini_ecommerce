// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { rateProduct, getProductRatings } from "@/lib/api/products";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

interface ProductRatingProps {
  productId: string;
  onRatingSubmitted?: () => void;
}

export default function ProductRating({
  productId,
  onRatingSubmitted,
}: ProductRatingProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [userExistingRating, setUserExistingRating] = useState<any>(null);

  // Fetch the user's existing rating when the component mounts or user changes
  useEffect(() => {
    async function fetchUserRating() {
      if (!user) return;

      try {
        // Get all ratings for this product
        const ratings = await getProductRatings(productId);

        // Find the user's rating if it exists
        // We need to get the user's customerId first
        const userInfo = await apiClient("/auth/me", { requireAuth: true });
        const customerId = userInfo?.customerId;

        if (customerId) {
          const userRating = ratings.find((r) => r.customerId === customerId);
          if (userRating) {
            setUserExistingRating(userRating);
            // Pre-fill the form with existing rating data
            setRating(userRating.value);
            setComment(userRating.comment || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user's existing rating:", error);
      }
    }

    fetchUserRating();
  }, [productId, user]);

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleMouseEnter = (value: number) => {
    setHoveredRating(value);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You need to be logged in to rate products", {
        duration: 3000,
        position: "bottom-right",
      });

      // Redirect to login page
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    if (rating === 0) {
      toast.error("Please select a star rating before submitting", {
        duration: 3000,
        position: "bottom-right",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the rating
      await rateProduct(productId, {
        rating,
        comment: comment.trim() || undefined,
      });

      // Determine if this was an update or a new rating
      const actionType = userExistingRating ? "updated" : "submitted";

      toast.success(`Thank you! Your review has been ${actionType}.`, {
        duration: 3000,
        position: "bottom-right",
        icon: "⭐",
      });

      // Reset form and hide it
      setShowForm(false);

      // Refresh ratings if callback provided
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);

      let errorMessage = "Failed to submit rating. Please try again later.";

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error cases
        if (errorMessage.includes("customer profile")) {
          errorMessage =
            "You need a customer profile to rate products. Please update your account information.";

          // Redirect to account page to update profile
          toast.error(errorMessage, {
            duration: 5000,
            position: "bottom-right",
          });

          setTimeout(() => {
            router.push("/account/profile");
          }, 2000);

          return;
        }
      }

      toast.error(errorMessage, {
        duration: 3000,
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      toast.error("You need to be logged in to write a review", {
        duration: 3000,
        position: "bottom-right",
      });

      // Redirect to login page
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    setShowForm(true);
  };

  return (
    <div className="mt-6">
      {!showForm ? (
        <button
          onClick={handleWriteReviewClick}
          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          {userExistingRating ? "Edit your review" : "Write a review"}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">
            {userExistingRating ? "Update your rating" : "Rate this product"}
          </h3>

          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleMouseEnter(value)}
                onMouseLeave={handleMouseLeave}
                className="text-2xl cursor-pointer focus:outline-none"
              >
                <span
                  className={`${
                    (hoveredRating || rating) >= value
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0
                ? `You selected ${rating} star${rating !== 1 ? "s" : ""}`
                : "Select a rating"}
            </span>
          </div>

          <div className="mb-4">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your review (optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your experience with this product..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <LoadingSpinner size="xs" color="white" />
              ) : userExistingRating ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
