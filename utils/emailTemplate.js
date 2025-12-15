import dotenv from "dotenv"
dotenv.config()

// Welcome email
export const welcomeEmail = (toEmail, toName) => ({
  from: process.env.SENDER_EMAIL,
  to: toEmail,
  subject: "Welcome to Todo App!",
  html: `
    <h1>Welcome, ${toName}!</h1>
    <p>Thanks for joining Todo App. Start creating todos and collaborating with your team!</p>
  `,
});

// Invitation email
export const invitationEmail = (toEmail, todoTitle, inviteLink) => ({
  from: process.env.SENDER_EMAIL,
  to: toEmail,
  subject: `You're invited to collaborate on "${todoTitle}"`,
  html: `
    <p>You have been invited to collaborate on the Todo: <strong>${todoTitle}</strong></p>
    <p>Click <a href="${inviteLink}">here</a> to accept the invitation and join the app.</p>
    <p>If you don't have an account yet, signing up will automatically accept the invitation.</p>
  `,
});
