// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    // req.user đã được gán từ authMiddleware
    res.status(200).json(req.user);
};

export { getMe };