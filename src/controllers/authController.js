const STask = require('../models/STask');

exports.verifySessionAndGetProject = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    // ✅ FIX 1: Only fetch the fields we need to prevent massive loading times
    const project = await STask.findById(projectId)
  .select('name btdescription testConfig applicants resourceLink1 resourceLink2 resourceLink3')
  .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const applicant = project.applicants.find(
      (a) => String(a.applicantId) === String(req.user._id)
    );

    if (!applicant) {
      return res.status(403).json({ success: false, message: 'You have not applied to this project.' });
    }

    res.status(200).json({
  success: true,
  project: {
    _id: project._id,
    name: project.name,
    btdescription: project.btdescription,
    testConfig: project.testConfig,
    resourceLink1: project.resourceLink1,
    resourceLink2: project.resourceLink2,
    resourceLink3: project.resourceLink3,
  }
});

  } catch (error) {
    console.error("BACKEND CATCH ERROR:", error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};