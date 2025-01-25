const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  res.status(500).json({
    error: "Something went wrong",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

module.exports = errorHandler;
