import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
      title: {
            type: String,
            required: [true, "Title is required"],
            trim: true
      },
      completed: {
            type: Boolean,
            default: false
      },
      createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Todo owner didn't found"]
      },
      subTodos: [
            {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "SubTodo"
            }
      ],
      collaborators: [
            {
                  user: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                  },
                  email: {
                        type: String,
                        required: [true, "Email is required to invite"],
                        lowercase: true,
                        trim: true,
                        validate: {
                              validator: function (v) {
                                    return /^\S+@\S+\.\S+$/.test(v);
                              },
                              message: props => `${props.value} is not a valid email!`
                        }
                  },
                  permission: {
                        type: String,
                        enum: ["read", "write"],
                        default: "write"
                  },
                  status: {
                        type: String,
                        enum: ["pending", "accepted"],
                        default: "pending"
                  }
            }
      ]
}, { timestamps: true })

export const Todo = mongoose.model("Todo", todoSchema)