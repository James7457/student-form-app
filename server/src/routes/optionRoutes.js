const express = require("express");

const {
  createOption,
  getOptionsByQuestion,
  replaceOptions,
} = require("../controllers/optionController");

const router = express.Router();

router.post("/", createOption);

router.get(
  "/question/:questionId",
  getOptionsByQuestion
);

router.put(
  "/question/:questionId",
  replaceOptions
);

module.exports = router;