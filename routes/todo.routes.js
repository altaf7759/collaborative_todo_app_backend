import express from "express"
import { changeTodoPermission, createTodo, deleteTodo, getAllTodos, getAllTodosWithoutCollaborators, getSingleByTodoId, updateTodo } from "../controllers/todo.controllers.js"
import { checkAuth } from "../middlewares/auth.middlewares.js"

export const todoRouter = express.Router()

todoRouter.post("/create", checkAuth, createTodo)
todoRouter.patch("/update/:todoId", checkAuth, updateTodo)
todoRouter.delete("/delete/:todoId", checkAuth, deleteTodo)
todoRouter.get("/get-all", checkAuth, getAllTodos)
todoRouter.get("/get-todo-by-id/:todoId", checkAuth, getSingleByTodoId)
todoRouter.get("/get-all-for-home", checkAuth, getAllTodosWithoutCollaborators)
todoRouter.put("/update/permission/:todoId", checkAuth, changeTodoPermission)