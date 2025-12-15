import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { transporter } from "../services/emailService.js";
import { welcomeEmail } from "../utils/emailTemplate.js";

export const registerUser = async (req, res) => {
      try {
            const { userName, email, password } = req.body;

            if (!userName || !email || !password) {
                  return res.status(400).json({ success: false, message: "Missing value" });
            }

            // Check for existing userName
            if (await User.findOne({ userName })) {
                  return res.status(409).json({ success: false, message: "userName already exists" });
            }

            // Check for existing email
            if (await User.findOne({ email })) {
                  return res.status(409).json({ success: false, message: "Email already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Prepare user object
            const user = new User({ userName, email, password: hashedPassword });

            // Send welcome
            try {
                  await transporter.sendMail(welcomeEmail(email, userName));
            } catch (emailError) {
                  console.error("Failed to send welcome email:", emailError.message);
                  return res.status(500).json({
                        success: false,
                        message: "User creation failed: could not send welcome email"
                  });
            }

            // Save user
            await user.save();

            res.status(201).json({ success: true, message: "User created successfully" });

      } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error while creating user" });
      }
};

export const loginUser = async (req, res) => {
      try {
            const { identifier, password } = req.body

            // Check for inputs
            if (!identifier || !password) {
                  return res.status(400).json({
                        success: false,
                        message: "Missing values"
                  })
            }

            // Check for user in database
            const user = await User.findOne({
                  $or: [{ email: identifier }, { userName: identifier }]
            })

            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found"
                  })
            }

            // Check for password match
            const isPasswordMatch = await bcrypt.compare(password, user.password)

            if (!isPasswordMatch) {
                  return res.status(401).json({
                        success: false,
                        message: "Invalid credentials"
                  })
            }

            // Create token
            const token = jwt.sign({
                  userId: user._id,
                  userName: user.userName,
                  email: user.email
            },
                  process.env.JWT_SECRET,
                  {
                        expiresIn: "1d"
                  }
            )

           res.cookie("token", token, {
              httpOnly: true,
              secure: true,       // MUST be true for SameSite=None
              sameSite: "none",   // allow cross-site
              maxAge: 24 * 60 * 60 * 1000
            });.status(200).json({
                  success: true,
                  message: "Login Successfully",
                  user
            })

      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while login"
            })
      }
}

export const logoutUser = async (req, res) => {
      try {
            res.clearCookie("token", {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  sameSite: "strict"
            }).status(200).json({
                  success: true,
                  message: "Logout successfully"
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while logout"
            })
      }
}

export const generateOtp = async (req, res) => {
      try {
            const { userId } = req.user;

            const user = await User.findById(userId);
            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found"
                  });
            }

            const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
            const otpExpiry = Date.now() + 10 * 60 * 1000; // valid for 10 minutes

            user.otp = otp;
            user.otpExpiresAt = otpExpiry;
            await user.save();

            // Send OTP via email
            await transporter.sendMail({
                  from: process.env.SENDER_EMAIL,
                  to: user.email,
                  subject: "Your OTP for Password Reset",
                  text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
            });

            res.status(200).json({
                  success: true,
                  message: "OTP sent to your email"
            });

      } catch (error) {
            console.error(error);
            res.status(500).json({
                  success: false,
                  message: "Error generating OTP"
            });
      }
};

export const resetPassword = async (req, res) => {
      try {
            const { otp, newPassword } = req.body;
            const { userId } = req.user;

            if (!otp || !newPassword) {
                  return res.status(400).json({
                        success: false,
                        message: "OTP and new password are required"
                  });
            }

            const user = await User.findById(userId);
            if (!user) {
                  return res.status(404).json({
                        success: false,
                        message: "User not found"
                  });
            }

            if (!user.otp || !user.otpExpiresAt) {
                  return res.status(400).json({
                        success: false,
                        message: "OTP not generated. Please request a new one."
                  });
            }

            if (user.otp !== otp) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid OTP"
                  });
            }

            if (user.otpExpiresAt < Date.now()) {
                  return res.status(400).json({
                        success: false,
                        message: "OTP has expired. Please request a new one."
                  });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Clear OTP fields
            user.otp = undefined;
            user.otpExpiresAt = undefined;

            await user.save();

            res.status(200).json({
                  success: true,
                  message: "Password reset successfully!"
            });

      } catch (error) {
            console.error(error);
            res.status(500).json({
                  success: false,
                  message: "Error while resetting password"
            });
      }
};
