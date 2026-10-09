'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Star,
  Sparkles,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Heart,
  Wrench,
  Loader2,
  Send,
} from 'lucide-react';
import {
  getReviewByToken,
  submitLocalReview,
  getLocalJobs,
  getLocalCustomers,
  getLocalProfile,
} from '@/lib/store';
import { Review, Job, Customer, Profile } from '@/types';

export default function ReviewFunnelPage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [review, setReview] = useState<Review | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const prof = getLocalProfile();
    setProfile(prof);

    let rev = getReviewByToken(token);
    if (!rev) {
      rev = {
        id: `rev-${Date.now()}`,
        job_id: `job-public`,
        review_token: token,
        status: 'Pending',
        is_public: false,
        created_at: new Date().toISOString(),
      };
    }

    setReview(rev);

    const jobs = getLocalJobs();
    const j = jobs.find((jobItem) => jobItem.id === rev.job_id);
    if (j) {
      setJob(j);
      const custs = getLocalCustomers();
      const c = custs.find((custItem) => custItem.id === j.customer_id);
      setCustomer(c || null);
    }

    if (rev.rating) {
      setRating(rev.rating);
      setSubmitted(true);
    }
  }, [token]);

  const handleRatingSelect = (selectedStar: number) => {
    setRating(selectedStar);

    // If 4 or 5 stars, submit immediately as public & offer Google Maps redirect
    if (selectedStar >= 4) {
      setSubmitting(true);
      setTimeout(() => {
        submitLocalReview(token, selectedStar, '5-Star Google Review');
        setSubmitting(false);
        setSubmitted(true);
      }, 400);
    }
  };

  const handlePrivateFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setTimeout(() => {
      submitLocalReview(token, rating, feedbackText);
      setSubmitting(false);
      setSubmitted(true);
    }, 400);
  };

  const googleMapsUrl = profile?.google_review_url || 'https://maps.google.com';

  if (!review) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="apple-card p-8 text-center max-w-md w-full space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Loading Feedback Survey...</h2>
        </div>
      </div>
    );
  }

  const activeStars = hoverRating || rating || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-amber-50/20 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header Branding */}
        <div className="apple-card p-6 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {profile?.business_name || 'TradeFlow Services'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">Customer Experience & Review Collector</p>
          </div>
        </div>

        {submitted ? (
          rating && rating >= 4 ? (
            /* 4-5 STAR PUBLIC GOOGLE MAPS REDIRECT SCREEN */
            <div className="apple-card p-8 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-9 h-9 fill-amber-500" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Thank You So Much!</h2>
                <p className="mt-2 text-sm text-slate-600">
                  We are thrilled that you had a <strong className="text-amber-600">5-Star experience</strong> with {profile?.business_name}!
                </p>
              </div>

              <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200/80 space-y-3">
                <p className="text-xs font-semibold text-slate-800">
                  Would you mind sharing your 5-star feedback on our official Google Business Profile? It helps local homeowners find trusted contractors.
                </p>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apple-btn-primary w-full py-3.5 text-xs rounded-2xl bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-white border-none flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-white" />
                  Post Review on Google Maps
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          ) : (
            /* 1-3 STAR PRIVATE FEEDBACK CONFIRMATION */
            <div className="apple-card p-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Feedback Submitted Privately</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you for your candid feedback. Your thoughts have been submitted directly to management at {profile?.business_name}. We take every input seriously to continuously elevate our service quality.
              </p>
            </div>
          )
        ) : (
          /* Rating Screen */
          <div className="apple-card p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                How would you rate your recent service?
              </h2>
              <p className="text-xs text-slate-500">Select a star rating below</p>
            </div>

            {/* Interactive 5-Star Selector */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleRatingSelect(star)}
                  className="p-1 text-slate-300 hover:scale-125 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= activeStars
                        ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* 1-3 Star Private Feedback Form (Revealed if 1-3 stars selected) */}
            {rating && rating <= 3 && (
              <form onSubmit={handlePrivateFeedbackSubmit} className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
                <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 text-xs text-purple-900 font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Private Feedback Mode: Your comments are sent exclusively to management.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    What could we have improved during your service? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what went wrong so we can resolve it immediately..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="apple-btn-primary w-full py-3 text-xs rounded-2xl"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Private Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
