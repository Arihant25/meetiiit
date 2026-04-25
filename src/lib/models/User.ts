import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        batch: { type: String, required: true, trim: true, maxlength: 30 },
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
        },
        passwordHash: { type: String, required: true },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (arr: string[]) => arr.length <= 5,
                message: "At most 5 tags are allowed",
            },
        },
        about: { type: String, default: "", maxlength: 1200 },
        isVerified: { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false },
        otp: { type: String, required: true, minlength: 6, maxlength: 6 },
    },
    { timestamps: true }
);

userSchema.index({ tags: 1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = models.User || model("User", userSchema);
