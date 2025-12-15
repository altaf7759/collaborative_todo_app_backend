import { Todo } from "../models/todo.models.js";

export const createTodo = async (req, res) => {
      try {
            const { title } = req.body
            const { userId } = req.user

            // Check for title
            if (!title) {
                  return res.status(400).json({
                        success: false,
                        message: "Title is required to create todo"
                  })
            }

            // Create todo
            const todo = new Todo({
                  title,
                  createdBy: userId
            })
            await todo.save()

            res.status(201).json({
                  success: true,
                  message: "Todo created successfully",
                  todo
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while creating todo"
            })
      }
}

export const updateTodo = async (req, res) => {
      try {
            const { title } = req.body;
            const { todoId } = req.params;
            const { userId } = req.user;

            // Check for title
            if (!title) {
                  return res.status(400).json({
                        success: false,
                        message: "Title is required to update todo",
                  });
            }

            // Fetch the todo
            const todo = await Todo.findById(todoId);
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found",
                  });
            }

            // Permission check
            const isOwner = todo?.createdBy?.toString() === userId;
            const collaborator = todo?.collaborators?.find(
                  (c) => c?.user?.toString() === userId
            );
            const hasWriteAccess = collaborator?.permission === "write";

            if (!isOwner && !hasWriteAccess) {
                  return res.status(403).json({
                        success: false,
                        message: "You don't have permission to update this todo",
                  });
            }

            // Update the todo
            const updatedTodo = await Todo.findByIdAndUpdate(
                  todoId,
                  { title },
                  { new: true }
            );

            return res.status(200).json({
                  success: true,
                  message: "Todo updated successfully",
                  updatedTodo,
            });
      } catch (error) {
            console.error(error);
            res.status(500).json({
                  success: false,
                  message: "Server error while updating todo",
            });
      }
};

export const deleteTodo = async (req, res) => {
      try {
            const { todoId } = req.params
            const { userId } = req.user

            // Find todo
            const todo = await Todo.findById(todoId)
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found"
                  })
            }

            // Check permission
            const isOwner = todo.createdBy.toString() === userId
            if (!isOwner) {
                  return res.status(403).json({
                        success: false,
                        message: "You are not authorized to delete this todo"
                  })
            }

            // Delete todo
            const deletedTodo = await Todo.findByIdAndDelete(todoId)

            res.status(200).json({
                  success: true,
                  message: "Todo deleted successfully",
                  deletedTodo
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while deleting todo"
            })
      }
}

export const getAllTodos = async (req, res) => {
      try {
            const { userId } = req.user

            const todos = await Todo.find({
                  $or: [
                        { createdBy: userId },
                        { "collaborators.user": userId }
                  ]
            })
                  .populate("createdBy", "userName email")
                  .populate("collaborators.user", "userName email")
                  .populate("subTodos")
                  .sort({ createdAt: -1 });

            res.status(200).json({
                  success: true,
                  todos
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while fetching todos"
            })
      }
}

export const getSingleByTodoId = async (req, res) => {
      try {
            const { todoId } = req.params

            const todo = await Todo.findById(todoId)
                  .populate("createdBy")
                  .populate({
                        path: "collaborators",
                        populate: { path: "user" }
                  })
                  .populate({
                        path: "subTodos",
                        populate: { path: "createdBy" }
                  });

            // ✅ Check if ALL subtodos are completed
            const isTodoCompleted = todo.subTodos.every(
                  (st) => st.completed === true
            )

            // ✅ Update parent todo status
            todo.completed = isTodoCompleted
            await todo.save()

            res.status(200).json({
                  success: true,
                  todo
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while fetching todos"
            })
      }
}

export const getAllTodosWithoutCollaborators = async (req, res) => {
      try {
            const { userId } = req.user

            const todos = await Todo.find({
                  $or: [
                        { createdBy: userId },
                        { "collaborators.user": userId }
                  ]
            })
                  .populate("subTodos")
                  .sort({ createdAt: -1 })
                  .select("-collaborators")

            res.status(200).json({
                  success: true,
                  todos
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while fetching todos"
            })
      }
}

export const changeTodoPermission = async (req, res) => {
      try {
            const { userId } = req.user
            const { todoId } = req.params
            const { collaboratorEmail, permission } = req.body

            // Validate inputs
            if (!collaboratorEmail || !permission) {
                  return res.status(400).json({
                        success: false,
                        message: "Collaborator email and permission are required"
                  })
            }

            // Validate permission
            if (!["read", "write"].includes(permission)) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid permission value"
                  })
            }
            // Check for todo
            const todo = await Todo.findById(todoId)
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found"
                  })
            }

            // Only owner can update permissions
            if (todo.createdBy.toString() !== userId) {
                  return res.status(403).json({
                        success: false,
                        message: "Only owner can update permission"
                  })
            }

            // Find collaborator
            const collaborator = todo.collaborators.find((c) => c.email.toLowerCase() === collaboratorEmail.toLowerCase())

            if (!collaborator) {
                  return res.status(404).json({
                        success: false,
                        message: "Collaborator not found for this todo"
                  })
            }

            // Update permission
            collaborator.permission = permission

            await todo.save()

            res.status(200).json({
                  success: true,
                  message: "Todo permission updated successfully",
                  todo
            })
      } catch (error) {
            console.log(error)
            return res.status(500).json({
                  success: false,
                  message: "Server error while updating permission"
            })
      }
}