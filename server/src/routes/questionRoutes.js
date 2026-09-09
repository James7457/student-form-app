const express = require("express");

const {
  createQuestion,
  getQuestionsByForm,
} = require("../controllers/questionController");

const router = express.Router();

router.post("/", createQuestion);

router.get("/form/:formId", getQuestionsByForm);

module.exports = router;