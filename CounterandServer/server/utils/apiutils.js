/**
 * Handles sending a standardized JSON response for API routes.
 * @param {object} res The Express response object.
 * @param {Promise} servicePromise The promise returned from a service method.
 * @param {number} [successStatus=200] The HTTP status code for a successful response.
 */
const handleResponse = async (res, servicePromise, successStatus = 200) => {
    
    try {
        const data = await servicePromise;
        res.status(successStatus).json({ success: true, data:data() });
    } catch (error) {
        // Log the full error on the server for debugging
        console.error('API Error:', error.message);
        // Send a generic error to the client
        res.status(500).json({ success: false, error: error.message || 'An internal server error occurred.' });
    }
};

module.exports = { handleResponse };
