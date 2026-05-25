const GlobalExercise = require("../models/GlobalExercise");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.searchExercises = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const expression = query ? new RegExp(escapeRegExp(query), "i") : /.*/i;

    const exercises = await GlobalExercise.find({
      $or: [{ nameEn: expression }, { nameAr: expression }],
    })
      .sort({ nameAr: 1, nameEn: 1 })
      .limit(15);

    res.status(200).json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    console.error("SearchExercises Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching exercises",
      error: error.message,
    });
  }
};
