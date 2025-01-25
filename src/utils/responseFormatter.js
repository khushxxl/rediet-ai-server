class ResponseFormatter {
  static success(data) {
    return {
      success: true,
      data,
    };
  }

  static error(message, statusCode = 500) {
    return {
      success: false,
      error: {
        message,
        statusCode,
      },
    };
  }
}

module.exports = ResponseFormatter;
