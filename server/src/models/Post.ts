import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPost {
  _id: Schema.Types.ObjectId;
  title: string;
  content: string;
  checkedBy: Types.Array<Types.ObjectId>;
  // Users who pressed "I want to answer" — names only, no points.
  responders: Types.Array<Types.ObjectId>;
  createdAt: Date;
}
const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    checkedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    responders: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

postSchema.index({ createdAt: -1 });

export const Post: Model<IPost> =
  (models.Post as Model<IPost>) || model<IPost>("Post", postSchema);

export default Post;
