const STask = require('../models/STask');

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Use select() here too to keep it fast
    const project = await STask.findById(id)
      .select('name btdescription testConfig resourceLink1 resourceLink2 resourceLink3')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
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
    console.error("Project fetch error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};