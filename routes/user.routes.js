import express from "express"

import { generateOtp, loginUser, logoutUser, registerUser, resetPassword } from "../controllers/user.controllers.js"
import { checkAuth } from "../middlewares/auth.middlewares.js"

export const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/logout", checkAuth, logoutUser)
userRouter.post("/generate-otp", checkAuth, generateOtp)
userRouter.patch("/reset-password", checkAuth, resetPassword)