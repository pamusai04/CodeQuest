const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

class ProblemError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ProblemError";
    }
}

const createProblem = async (req, res) => {
    const {
        title, description, difficulty, tags,
        visibleTestCases, hiddenTestCases, startCode, referenceSolution
    } = req.body;

    try {
        if (!title || !description || !difficulty || !tags || !visibleTestCases || !hiddenTestCases || !startCode || !referenceSolution) {
            throw new ProblemError("All fields are required");
        }

        for (const { language, completeCode } of referenceSolution) {
            const languageId = getLanguageById(language);
            if (!languageId) {
                throw new ProblemError(`Unsupported language: ${language}`);
            }

            const submissions = visibleTestCases.map(testcase => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult = await submitBatch(submissions);
            const resultToken = submitResult.map(value => value.token);
            const testResult = await submitToken(resultToken);

            for (const test of testResult) {
                if (test.status_id !== 3) {
                    throw new ProblemError(`Test case validation failed for ${language} solution`);
                }
            }
        }

        const problem = await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        });

        return res.status(201).json({ error: false, message: "Problem created successfully", problem });
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const {
        visibleTestCases = [], hiddenTestCases = [], referenceSolution = [], ...restData
    } = req.body;

    try {
        if (!id) {
            throw new ProblemError("Missing ID field");
        }

        const existingProblem = await Problem.findById(id);
        if (!existingProblem) {
            throw new ProblemError("Problem not found", 404);
        }

        if (!Array.isArray(visibleTestCases) || !Array.isArray(hiddenTestCases) || !Array.isArray(referenceSolution)) {
            throw new ProblemError("visibleTestCases, hiddenTestCases, and referenceSolution must be arrays");
        }

        if (visibleTestCases.length === 0 || hiddenTestCases.length === 0) {
            throw new ProblemError("At least one visible and one hidden test case is required");
        }

        for (const { language, completeCode } of referenceSolution) {
            if (!language || !completeCode) {
                throw new ProblemError("Each reference solution must have language and completeCode");
            }

            const languageId = getLanguageById(language);
            if (!languageId) {
                throw new ProblemError(`Unsupported language: ${language}`);
            }

            const submissions = visibleTestCases.map(testcase => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

            const submitResult = await submitBatch(submissions);
            const resultToken = submitResult.map(value => value.token);
            const testResult = await submitToken(resultToken);

            for (const test of testResult) {
                if (test.status_id !== 3) {
                    throw new ProblemError(`Test case validation failed for ${language} solution`);
                }
            }
        }

        const updatedProblem = await Problem.findByIdAndUpdate(
            id,
            { ...restData, visibleTestCases, hiddenTestCases, referenceSolution },
            { runValidators: true, new: true }
        );

        return res.status(200).json({ error: false, message: "Problem updated successfully", problem: updatedProblem });
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            throw new ProblemError("Missing ID field");
        }

        const deletedProblem = await Problem.findByIdAndDelete(id);
        if (!deletedProblem) {
            throw new ProblemError("Problem not found", 404);
        }

        return res.status(200).json({ error: false, message: "Problem deleted successfully" });
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const getProblemById = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            throw new ProblemError("Missing ID field");
        }

        const problem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution');
        if (!problem) {
            throw new ProblemError("Problem not found", 404);
        }

        return res.status(200).json(problem);
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const getAllProblem = async (req, res) => {
    try {
        const problems = await Problem.find({}).select('_id title difficulty tags');
        if (problems.length === 0) {
            throw new ProblemError("No problems found", 404);
        }

        return res.status(200).json(problems);
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const solvedAllProblembyUser = async (req, res) => {
    try {
        const userId = req.result._id;
        const user = await User.findById(userId).populate({
            path: "problemSolved",
            select: "_id title difficulty tags"
        });

        return res.status(200).json(user.problemSolved || []);
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const submittedProblem = async (req, res) => {
    try {
        const userId = req.result._id;
        const { pid: problemId } = req.params;

        if (!problemId) {
            throw new ProblemError("Missing problem ID");
        }

        const submissions = await Submission.find({ userId, problemId });
        return res.status(200).json(submissions);
    } catch (error) {
        if (error instanceof ProblemError) {
            return res.status(error.statusCode).json({ error: true, message: error.message });
        }
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

module.exports = {
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemById,
    getAllProblem,
    solvedAllProblembyUser,
    submittedProblem
};