import mongoose from 'mongoose'

export const User = mongoose.model('User', {
  dbV1Id: Number,
  username: String,
  email: String,
  authType: String,
  passwordHash: String,
  passwordSalt: String,
  name: String,
  groups: [String],
});