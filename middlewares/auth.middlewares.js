import jwt from "jsonwebtoken"

export const checkAuth = async (req, res, next) => {
      try {
            const { token } = req.cookies

            if (!token) {
                  return res.status(401).json({
                        success: false,
                        message: "Unauthorized: not token provided"
                  })
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

            req.user = decodedToken

            next()
      } catch (error) {
            console.log(error)
            return res.status(403).json({
                  success: false,
                  message: "Invalid or expired token"
            })
      }
}