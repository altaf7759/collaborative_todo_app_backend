import express from "express"

import { checkAuth } from "../middlewares/auth.middlewares.js"
import { completeSubTodo, createSubTodo, deleteSubTodo, updateSubTodo } from "../controllers/subTodo.controllers.js"

export const subTodoRouter = express.Router()

subTodoRouter.post("/create/:todoId", checkAuth, createSubTodo)
subTodoRouter.put("/update/:subTodoId", checkAuth, updateSubTodo)
subTodoRouter.delete("/delete/:subTodoId", checkAuth, deleteSubTodo)
subTodoRouter.patch("/complete/:subTodoId", checkAuth, completeSubTodo)