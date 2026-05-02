const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (!req.cookies.token) {
    req.flash("error", "Owner login required");
    return res.redirect("/owners/login");
  }

  try {
    const data = jwt.verify(req.cookies.token, process.env.JWT_KEY);

    if (data.role !== "owner") {
      req.flash("error", "You are not authorized to access this page");
      return res.redirect("/");
    }

    req.owner = data;
    next();
  } catch (err) {
    res.cookie("token", "");
    req.flash("error", "Session expired, please login again");
    return res.redirect("/owners/login");
  }
};
