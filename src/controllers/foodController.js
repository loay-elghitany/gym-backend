const GlobalFood = require("../models/GlobalFood");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.searchFoods = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const expression = query ? new RegExp(escapeRegExp(query), "i") : /.*/i;

    const foods = await GlobalFood.find({
      $or: [{ nameEn: expression }, { nameAr: expression }],
    })
      .sort({ nameAr: 1, nameEn: 1 })
      .limit(15);

    res.status(200).json({
      success: true,
      data: foods,
    });
  } catch (error) {
    console.error("SearchFoods Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching foods",
      error: error.message,
    });
  }
};
