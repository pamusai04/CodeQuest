const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
       
      for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);


       console.log(testResult);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


      // We can store it in our DB

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const {
    visibleTestCases = [],
    hiddenTestCases = [],
    referenceSolution = [],
    ...restData
  } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "Missing ID Field" });
    }

    const existingProblem = await Problem.findById(id);
    if (!existingProblem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Validate required arrays exist and are arrays
    if (!Array.isArray(visibleTestCases) || !Array.isArray(hiddenTestCases) || !Array.isArray(referenceSolution)) {
      return res.status(400).json({ 
        message: "visibleTestCases, hiddenTestCases, and referenceSolution must be arrays" 
      });
    }

    // Validate at least one test case exists
    if (visibleTestCases.length === 0 || hiddenTestCases.length === 0) {
      return res.status(400).json({ 
        message: "At least one visible and one hidden test case is required" 
      });
    }

    // Validate reference solutions
    for (const { language, completeCode } of referenceSolution) {
      if (!language || !completeCode) {
        return res.status(400).json({ 
          message: "Each reference solution must have language and completeCode" 
        });
      }

      const languageId = getLanguageById(language);
      if (!languageId) {
        return res.status(400).json({ 
          message: `Unsupported language: ${language}` 
        });
      }

      // Validate test cases with Judge0
      const submissions = visibleTestCases.map(testcase => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
      }));

      try {
        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map(value => value.token);
        const testResult = await submitToken(resultToken);

        for (const test of testResult) {
          if (test.status_id !== 3) { // 3 means accepted
            return res.status(400).json({ 
              message: `Test case validation failed for ${language} solution`,
              details: test
            });
          }
        }
      } catch (error) {
        console.error('Judge0 validation error:', error);
        return res.status(422).json({ 
          message: "Failed to validate test cases with Judge0",
          error: error.message 
        });
      }
    }

    // Update the problem
    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      {
        ...restData,
        visibleTestCases,
        hiddenTestCases,
        referenceSolution
      },
      { runValidators: true, new: true }
    );

    return res.status(200).json(updatedProblem);
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}

const getProblemById  = async(req, res)=>{
    const {id} = req.params;
    try {
        if(!id){
           return res.status(400).send("Missing ID Field");
        }

        const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution');
        // console.log(getProblem);
        if(!getProblem){
            return res.status(404).send("Problem is Missing");
        }

        res.status(200).send(getProblem);
    } catch (error) {
        res.status(500).send("Error is : "+error);
    }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}


const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

   const ans = await Submission.find({userId,problemId});
  
  if(ans.length==0)
    res.status(200).send("No Submission is persent");

  res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


