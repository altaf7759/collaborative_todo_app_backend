import jwt from "jsonwebtoken"

import { Todo } from "../models/todo.models.js";
import { User } from "../models/user.models.js"
import { transporter } from "../services/emailService.js"
import { invitationEmail } from "../utils/emailTemplate.js";

export const inviteForTodoCollaboration = async (req, res) => {
      try {
            const { email, permission = "write" } = req.body
            const { todoId } = req.params
            const { userId } = req.user

            // Validate email
            if (!email) {
                  return res.status(400).json({
                        success: false,
                        message: "Email is required to send invitation"
                  })
            }

            // Find todo
            const todo = await Todo.findById(todoId)
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found"
                  })
            }

            // Can not invite self
            const creator = await User.findById(todo.createdBy)
            if (creator.email.toLowerCase() === email) {
                  return res.status(400).json({
                        success: false,
                        message: "You can't invite your self"
                  })
            }

            // Only creator can invite for collaboration
            if (!todo.createdBy.toString() === userId) {
                  return res.status(403).json({
                        success: false,
                        message: "Only creator can invite for collaboration"
                  })
            }

            // Check email is already a collaborator
            const existing = todo.collaborators.find((c) => c.email === email.toLowerCase())
            if (existing) {
                  return res.status(409).json({
                        success: false,
                        message: "User is already invited as a collaborator"
                  })
            }

            // Check if user, want to invite does exists
            const user = await User.findOne({ email })

            // Generate token
            const token = jwt.sign(
                  {
                        todoId: todo._id,
                        email
                  },
                  process.env.JWT_SECRET,
                  {
                        expiresIn: "7d"
                  }
            )

            // Invitation link
            const inviteLink = `${process.env.FRONTEND_BASE_URL}/invite?token=${token}`

            // Send invitation email
            try {
                  await transporter.sendMail(
                        invitationEmail(email, todo.title, inviteLink)
                  );
            } catch (emailError) {
                  console.error("Email sending failed:", emailError);

                  return res.status(500).json({
                        success: false,
                        message: "Failed to send invitation email. Please try again."
                  });
            }

            // Add collaborator with pending status
            todo.collaborators.push({
                  email,
                  user: user ? user._id : null,
                  permission,
                  status: "pending"
            })

            // Save todo
            await todo.save()

            res.status(200).json({
                  success: true,
                  message: `Invitation sent to ${email} successfully`,
                  todo,
                  token,
                  user
            })
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while inviting member"
            })
      }
}

export const acceptInvitation = async (req, res) => {
      try {
            const { token } = req.body;

            if (!token) {
                  return res.status(400).json({
                        success: false,
                        message: "Invitation token is required",
                  });
            }

            // Decode token
            let decodedToken;
            try {
                  decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                  return res.status(401).json({
                        success: false,
                        message: "Invalid or expired token",
                  });
            }

            const { email, todoId } = decodedToken;

            // Find todo
            const todo = await Todo.findById(todoId);
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found",
                  });
            }

            // Find collaborator
            const collaborator = todo.collaborators.find(
                  (c) => c.email === email.toLowerCase()
            );

            if (!collaborator) {
                  return res.status(401).json({
                        success: false,
                        message: "You are not invited to collaborate on this todo",
                  });
            }

            // Check user
            const existingUser = await User.findOne({ email });

            if (!existingUser) {
                  return res.status(200).json({
                        success: false,
                        requireSignup: true,
                        message: "User not registered",
                        token,
                        email,
                        todoId
                  });
            }

            // Accept invitation
            collaborator.user = existingUser._id;
            collaborator.status = "accepted";
            await todo.save();

            return res.status(200).json({
                  success: true,
                  message: "Invitation accepted successfully",
                  todoId,
            });
      } catch (error) {
            console.log(error);
            return res.status(500).json({
                  success: false,
                  message: "Server error",
            });
      }
};

export const completeInvitationForNonUser = async (req, res) => {
      try {
            const { token } = req.body
            const { userId } = req.user

            if (!token) {
                  return res.status(400).json({
                        success: false,
                        message: "Token is missing"
                  });
            }

            // Decode token
            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                  return res.status(401).json({
                        success: false,
                        message: "Invalid or expired token"
                  });
            }

            const { email, todoId } = decoded;

            // Find todo
            const todo = await Todo.findById(todoId);
            if (!todo) {
                  return res.status(404).json({
                        success: false,
                        message: "Todo not found"
                  });
            }

            // Find collaborator entry
            const collaborator = todo.collaborators.find(
                  (c) => c.email === email.toLowerCase()
            );

            if (!collaborator) {
                  return res.status(401).json({
                        success: false,
                        message: "This email was not invited"
                  });
            }

            // Mark accepted & attach user ID
            collaborator.user = userId;
            collaborator.status = "accepted";

            await todo.save();

            return res.status(200).json({
                  success: true,
                  message: "Invitation accepted successfully",
                  todo
            });
      } catch (error) {
            console.log(error)
            res.status(500).json({
                  success: false,
                  message: "Server error while accepting invitation"
            })
      }
}