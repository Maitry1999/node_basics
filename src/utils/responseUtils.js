const createResponse = (status, message, data, error = null) => {
    const response = {
        status: status === 'success',  // boolean status field (true for success, false for error)
        message: message,              // Message about the operation
        data: data || null             // The actual data returned (can be null)
    };

    // Add error field only if it's not null
    if (error !== null) {
        response.error = error;
    }

    return response;
};

module.exports = createResponse;
