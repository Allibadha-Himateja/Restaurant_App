// Middleware to attach socket.io instance to request object
const socketMiddleware = (io) => {
    return (req, res, next) => {
        req.io = io;
        next();
    };
};

module.exports = socketMiddleware;