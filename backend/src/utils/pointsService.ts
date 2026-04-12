import User from '../models/User';

export const POINT_VALUES = {
  NEW_LISTING: 10,
  ACCEPTED_OFFER: 50,
  FIVE_STAR_REVIEW: 20,
  PROFILE_VERIFIED: 100,
  QUESTION_ASKED: 5,
  ANSWER_GIVEN: 10,
  BEST_ANSWER: 25,
  REFERRAL_COMPLETED: 100,
} as const;

export async function awardPoints(userId: string, amount: number): Promise<void> {
  if (!userId || amount === 0) return;
  try {
    await User.findOneAndUpdate(
      { userId },
      { $inc: { points: amount } }
    );
  } catch {
    // Points are non-critical — silently fail
  }
}
