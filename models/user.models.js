import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
      userName: {
            type: String,
            required: [true, "userName is required"],
            unique: true,
            lowercase: true,
            trim: true
      },
      email: {
            type: String,
            required: [true, "email is required"],
            unique: true,
            unique: true,
            trim: true,
            validate: {
                  validator: function (v) {
                        return /^\S+@\S+\.\S+$/.test(v);
                  },
                  message: props => `${props.value} is not a valid email!`
            }
      },
      password: {
            type: String,
            required: [true, "Password is required"],
            min: [6, "Password must be at least 6 characters long"],
            max: [255, "Password length can't more than 255 characters"]
      },
      otp: {
            type: String,
            min: [6, "OTP should be of 6 digits"],
            max: [6, "OTP should be of 6 digits"]
      },
      otpExpiresAt: {
            type: Date
      }
}, { timestamps: true })

export const User = mongoose.model("User", userSchema)