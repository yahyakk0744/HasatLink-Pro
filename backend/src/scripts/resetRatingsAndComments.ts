import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Rating from '../models/Rating';
import Comment from '../models/Comment';
import User from '../models/User';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hasatlink';
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  // 1. Delete all ratings
  const ratingsResult = await Rating.deleteMany({});
  console.log(`Deleted ${ratingsResult.deletedCount} ratings`);

  // 2. Delete all comments
  const commentsResult = await Comment.deleteMany({});
  console.log(`Deleted ${commentsResult.deletedCount} comments`);

  // 3. Reset averageRating and totalRatings on all users
  const usersResult = await User.updateMany({}, { $set: { averageRating: 0, totalRatings: 0 } });
  console.log(`Reset ratings for ${usersResult.modifiedCount} users`);

  await mongoose.disconnect();
  console.log('Done — disconnected');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
