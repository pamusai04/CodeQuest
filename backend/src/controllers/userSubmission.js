const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

class SubmissionError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "SubmissionError";
    }
}

const submitCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { id: problemId } = req.params;
        let { code, language } = req.body;

        if (!userId || !code || !problemId || !language) {
            throw new SubmissionError("Missing required fields");
        }

        if (language === 'cpp') language = 'c++';

        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new SubmissionError("Problem not found", 404);
        }

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases.length
        });

        const languageId = getLanguageById(language);
        if (!languageId) {
            throw new SubmissionError(`Unsupported language: ${language}`);
        }

        const submissions = problem.hiddenTestCases.map(testcase => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map(value => value.token);
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time);
                memory = Math.max(memory, test.memory);
            } else {
                status = test.status_id === 4 ? 'error' : 'wrong';
                errorMessage = test.stderr || 'Test case failed';
            }
        }

        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;
        await submittedResult.save();

        if (status === 'accepted' && !req.result.problemSolved.includes(problemId)) {
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }

        return res.status(201).json({
            error: false,
            accepted: status === 'accepted',
            totalTestCases: submittedResult.testCasesTotal,
            passedTestCases: testCasesPassed,
            runtime,
            memory
        });
    } catch (error) {
        if (error instanceof SubmissionError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const runCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { id: problemId } = req.params;
        let { code, language } = req.body;

        if (!userId || !code || !problemId || !language) {
            throw new SubmissionError("Missing required fields");
        }

        if (language === 'cpp') language = 'c++';

        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new SubmissionError("Problem not found", 404);
        }

        const languageId = getLanguageById(language);
        if (!languageId) {
            throw new SubmissionError(`Unsupported language: ${language}`);
        }

        const submissions = problem.visibleTestCases.map(testcase => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map(value => value.token);
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let success = true;
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time);
                memory = Math.max(memory, test.memory);
            } else {
                success = false;
                errorMessage = test.stderr || 'Test case failed';
            }
        }

        return res.status(201).json({
            error: false,
            success,
            testCases: testResult,
            runtime,
            memory
        });
    } catch (error) {
        if (error instanceof SubmissionError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

module.exports = { submitCode, runCode };