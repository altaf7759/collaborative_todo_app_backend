import dotenv from "dotenv"
dotenv.config()
import cookieParser from "cookie-parser"
import cors from "cors"

import express from "express"

import { connectDB } from "./db/db.js"
import { userRouter } from "./routes/user.routes.js"
import { todoRouter } from "./routes/todo.routes.js"
import { invitationRouter } from "./routes/invitation.routes.js"
import { subTodoRouter } from "./routes/subTodo.routes.js"

const app = express()
const PORT = process.env.PORT || 4000

// MongoDB connection
connectDB()

app.use(cookieParser())
app.use(express.json())
const allowedOrigin = "https://collaborative-todo-app-l4vy.vercel.app";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Handle OPTIONS preflight for all routes
app.options("*", cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// API Endpoints
app.use("/api/user", userRouter)
app.use("/api/todo", todoRouter)
app.use("/api/sub-todo", subTodoRouter)
app.use("/api/todo/invite", invitationRouter)

app.listen(PORT, () => console.log(`server started at port ${PORT}`))
