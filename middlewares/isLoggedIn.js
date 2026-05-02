const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (!req.cookies.token) {
    req.flash("error", "Login first");
    return res.redirect("/");
  }

  try {
    let data = jwt.verify(req.cookies.token, process.env.JWT_KEY);

    if (data.role !== "user") {
      req.flash("error", "Please login with a user account");
      return res.redirect("/");
    }

    req.user = data;
    next();
  } catch (err) {
    res.cookie("token", "");
    req.flash("error", "Session expired, please login again");
    return res.redirect("/");
  }
};
