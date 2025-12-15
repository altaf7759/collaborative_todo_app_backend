import mongoose from "mongoose";

const subTodoSchema = new mongoose.Schema({
      content: {
            type: String,
            required: [true, "Todo content is required"],
            trim: true
      },
      completed: {
            type: Boolean,
            default: false
      },
      createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sub-Todo owner didn't found"]
      },
      parentNode: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Todo",
            required: [true, "A sub-todo must have a parent-todo"]
      }
}, { timestamps: true })

export const SubTodo = mongoose.model("SubTodo", subTodoSchema)