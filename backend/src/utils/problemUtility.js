const axios = require('axios');

const getLanguageById = (lang) => {
    const languageMap = {
        'c++': 54,
        'cpp': 54,
        'java': 62,
        'javascript': 63
    };
    return languageMap[lang.toLowerCase()];
};

const submitBatch = async (submissions) => {
    try {
        // Base64-encode submission data
        const encodedSubmissions = submissions.map(submission => ({
            source_code: Buffer.from(submission.source_code).toString('base64'),
            language_id: submission.language_id,
            stdin: Buffer.from(submission.stdin).toString('base64'),
            expected_output: Buffer.from(submission.expected_output).toString('base64')
        }));

        const options = {
            method: 'POST',
            url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
            params: {
                base64_encoded: 'true' // Enable base64 encoding
            },
            headers: {
                'x-rapidapi-key': process.env.JUDGE0_KEY,
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            data: { submissions: encodedSubmissions }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('submitBatch error:', {
            message: error.message,
            responseData: error.response?.data,
            submissions: submissions.map(s => ({ language_id: s.language_id })),
            timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to submit batch: ${error.response?.data?.error || error.message}`);
    }
};

const submitToken = async (resultToken) => {
    const maxRetries = 10; // Prevent infinite loops
    const pollInterval = 1000; // 1 second

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(','),
            base64_encoded: 'true', // Enable base64 decoding
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.request(options);
            const submissions = response.data.submissions;
            const isResultObtained = submissions.every(r => r.status_id > 2);
            if (isResultObtained) {
                // Decode base64 fields
                return submissions.map(submission => ({
                    ...submission,
                    stdout: submission.stdout ? Buffer.from(submission.stdout, 'base64').toString('utf8') : null,
                    stderr: submission.stderr ? Buffer.from(submission.stderr, 'base64').toString('utf8') : null,
                    compile_output: submission.compile_output ? Buffer.from(submission.compile_output, 'base64').toString('utf8') : null
                }));
            }
            await sleep(pollInterval);
        } catch (error) {
            console.error('submitToken fetch error:', {
                message: error.message,
                responseData: error.response?.data,
                tokens: resultToken,
                attempt: attempt,
                timestamp: new Date().toISOString()
            });
            if (attempt === maxRetries) {
                throw new Error(`Failed to fetch submission results after ${maxRetries} attempts: ${error.response?.data?.error || error.message}`);
            }
        }
    }

    throw new Error(`Submission results not obtained after ${maxRetries} attempts`);
};

module.exports = { getLanguageById, submitBatch, submitToken };