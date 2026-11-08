import { Schema, model, models, type Model } from "mongoose";

export interface IUser {
  _id: Schema.Types.ObjectId;
  username: string;
  /**
   * bcrypt hash. Optional in the schema because accounts created before
   * authentication existed have no password yet; those users set one on
   * their first signup.
   */
  passwordHash?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", userSchema);

export default User;
