import { SubTodo } from "../models/subTodo.models.js"
import { Todo } from "../models/todo.models.js"

export const createSubTodo = async (req, res) => {
      try {
            const { content } = req.body;
            const { todoId } = req.params;
            const { userId } = req.user;

            if (!content) {
                  return res.status(400).json({
                        success: false,
                        message: "Content is required to create sub todo",
                  });
            }

            const todo = await Todo.findById(todoId);
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found",
                  });
            }

            // 🔐 Permission check
            if (todo.createdBy.toString() !== userId) {
                  const collaborator = todo.collaborators.find(
                        (c) => c.user?.toString() === userId
                  );

                  if (!collaborator) {
                        return res.status(403).json({
                              success: false,
                              message: "Unauthorized: you are not invited to this todo",
                        });
                  }

                  if (collaborator.permission !== "write") {
                        return res.status(403).json({
                              success: false,
                              message: "Permission denied: you only have read access",
                        });
                  }
            }

            // ✅ Create sub todo
            const subTodo = await SubTodo.create({
                  content,
                  createdBy: userId,
                  parentNode: todoId,
            });

            // ✅ Populate creator (THIS FIXES YOUR ISSUE)
            await subTodo.populate("createdBy", "_id userName email");

            // ✅ Push to todo
            todo.subTodos.push(subTodo._id);
            await todo.save();

            // Todo completion status
            const populatedTodo = await Todo.findById(todoId).populate("subTodos");
            const todoCompleted = populatedTodo.subTodos.every(
                  (st) => st.completed === true
            );

            populatedTodo.completed = todoCompleted;
            await populatedTodo.save();

            return res.status(201).json({
                  success: true,
                  message: "Sub todo created successfully",
                  subTodo,
                  todoCompleted,
            });
      } catch (error) {
            console.error(error);
            return res.status(500).json({
                  success: false,
                  message: "Server error while creating sub todo",
            });
      }
};

export const updateSubTodo = async (req, res) => {
      try {
            const { content } = req.body
            const { subTodoId } = req.params
            const { userId } = req.user

            // Validate input
            if (!content) {
                  return res.status(400).json({
                        success: false,
                        message: "Content is required to update todo"
                  })
            }

            // Find sub todo
            const subTodo = await SubTodo.findById(subTodoId)
            if (!subTodo) {
                  return res.status(404).json({
                        success: false,
                        message: "Sub todo not found"
                  })
            }

            // Find parent todo
            const todo = await Todo.findById(subTodo.parentNode)
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Parent todo not found"
                  })
            }

            // Determine rules
            const isTodoOwner = todo.createdBy.toString() === userId
            const isSubTodoCreator = subTodo.createdBy.toString() === userId
            const collaborator = todo.collaborators.find((c) => c.user?.toString() === userId)
            const hasWritePermission = collaborator?.permission === "write"
            const subTodoCreatedByTodoOwner = subTodo.createdBy.toString() === todo.createdBy.toString()

            // Rule 1: Todo owner -> full access
            if (isTodoOwner) {
                  subTodo.content = content
                  await subTodo.save();
                  return res.status(200).json({
                        success: true,
                        message: "Sub todo updated successfully",
                        subTodo
                  });
            }

            // Rule 2: SubTodo creator -> can update own or collaborator's subtodos, but NOT todo owner's
            if (isSubTodoCreator) {
                  // If this todo belong to todo creator
                  if (subTodoCreatedByTodoOwner) {
                        return res.status(403).json({
                              success: false,
                              message: "You are not allowed to update this sub todo"
                        });
                  }

                  subTodo.content = content
                  await subTodo.save();
                  return res.status(200).json({
                        success: true,
                        message: "Sub todo updated successfully",
                        subTodo
                  });
            }

            // Rle 3: Collaborator (write) → can update own or other collaborators' subtodos, NOT todo owner's
            if (collaborator && hasWritePermission) {
                  if (subTodoCreatedByTodoOwner) {
                        return res.status(403).json({
                              success: false,
                              message: "You cannot update the todo owner's sub todos"
                        })
                  }

                  subTodo.content = content
                  await subTodo.save()
                  return res.status(200).json({
                        success: true,
                        message: "Sub todo updated successfully",
                        subTodo
                  })
            }

            // Rle 4: All others (read-only collaborators, non-collaborators) → forbidden
            return res.status(403).json({
                  success: false,
                  message: "You are not allowed to update this sub todo"
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while updating sub todo"
            })
      }
}

export const deleteSubTodo = async (req, res) => {
      try {
            const { subTodoId } = req.params
            const { userId } = req.user

            const subTodo = await SubTodo.findById(subTodoId)
            if (!subTodo) {
                  return res.status(404).json({
                        success: false,
                        message: "Sub todo not found",
                  })
            }

            const todo = await Todo.findById(subTodo.parentNode)
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Parent todo not found",
                  })
            }

            const isTodoOwner = todo.createdBy.toString() === userId
            const isSubTodoCreator = subTodo.createdBy.toString() === userId
            const subTodoCreatedByTodoOwner =
                  subTodo.createdBy.toString() === todo.createdBy.toString()

            const collaborator = todo.collaborators.find(
                  (c) => c.user?.toString() === userId
            )

            // ❌ Collaborators can't delete
            if (collaborator && !isTodoOwner && !isSubTodoCreator) {
                  return res.status(403).json({
                        success: false,
                        message: "You can delete only your own sub todos",
                  })
            }

            // ❌ SubTodo creator can't delete owner's subTodo
            if (isSubTodoCreator && subTodoCreatedByTodoOwner && !isTodoOwner) {
                  return res.status(403).json({
                        success: false,
                        message: "You can't delete sub todo created by todo owner",
                  })
            }

            // ✅ Allowed → delete
            const deletedSubTodo = await SubTodo.findByIdAndDelete(subTodoId)

            // remove ref from todo
            todo.subTodos = todo.subTodos.filter(
                  (id) => id.toString() !== subTodoId
            )

            // 🔁 fetch remaining subtodos
            const remainingSubTodos = await SubTodo.find({
                  _id: { $in: todo.subTodos },
            })

            const isTodoCompleted =
                  remainingSubTodos.length > 0 &&
                  remainingSubTodos.every((st) => st.completed === true)

            todo.completed = isTodoCompleted
            await todo.save()

            return res.status(200).json({
                  success: true,
                  message: "Sub todo deleted successfully",
                  deletedSubTodo,
                  todoCompleted: todo.completed,
            })
      } catch (error) {
            console.log(error)
            return res.status(500).json({
                  success: false,
                  message: "Server error while deleting sub todo",
            })
      }
}

export const completeSubTodo = async (req, res) => {
      try {
            const { complete } = req.body
            const { subTodoId } = req.params

            // ✅ Validate boolean properly
            if (typeof complete !== "boolean") {
                  return res.status(400).json({
                        success: false,
                        message: "Complete must be a boolean value",
                  })
            }

            const subTodo = await SubTodo.findById(subTodoId)
            if (!subTodo) {
                  return res.status(404).json({
                        success: false,
                        message: "Sub todo not found",
                  })
            }

            // ✅ Update sub todo
            subTodo.completed = complete
            await subTodo.save()

            const todo = await Todo.findById(subTodo.parentNode).populate("subTodos")
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Parent todo not found for this sub todo",
                  })
            }

            // ✅ Check if ALL subtodos are completed
            const isTodoCompleted = todo.subTodos.every(
                  (st) => st.completed === true
            )

            // ✅ Update parent todo status
            todo.completed = isTodoCompleted
            await todo.save()

            return res.status(200).json({
                  success: true,
                  message: "Sub todo completion updated successfully",
                  subTodo,
                  todoCompleted: todo.completed
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Error while marking sub todo as complete",
            })
      }
}