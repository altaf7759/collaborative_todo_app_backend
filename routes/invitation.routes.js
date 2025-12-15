import express from "express"

import { checkAuth } from "../middlewares/auth.middlewares.js"
import { acceptInvitation, completeInvitationForNonUser, inviteForTodoCollaboration } from "../controllers/todoCollaboration.controllers.js"

export const invitationRouter = express.Router()

invitationRouter.post("/send/:todoId", checkAuth, inviteForTodoCollaboration)
invitationRouter.post("/accept", acceptInvitation)
invitationRouter.post("/complete", checkAuth, completeInvitationForNonUser)