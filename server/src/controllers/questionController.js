const db = require("../config/db");

/* =========================================
   CREATE QUESTION
========================================= */

const createQuestion = async (req, res) => {
  try {
    const {
      form_id,
      question_text,
      question_type,
      required,
      question_order,
    } = req.body;

    if (!form_id || !question_text || !question_type) {
      return res.status(400).json({
        message:
          "form_id, question_text and question_type are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO questions
      (form_id, question_text, question_type, required, question_order)
      VALUES (?, ?, ?, ?, ?)`,
      [
        form_id,
        question_text,
        question_type,
        required || false,
        question_order || 0,
      ]
    );

    res.status(201).json({
      message: "Question created successfully",
      question_id: result.insertId,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create question",
      error: error.message,
    });
  }
};


/* =========================================
   GET QUESTIONS BY FORM
========================================= */

const getQuestionsByForm = async (req, res) => {
  try {
    const { formId } = req.params;

    const [questions] = await db.query(
      `SELECT *
       FROM questions
       WHERE form_id = ?
       ORDER BY question_order ASC`,
      [formId]
    );

    /* Get options for each question */

    for (const question of questions) {

      const [options] = await db.query(
        `SELECT *
         FROM options
         WHERE question_id = ?
         ORDER BY option_order ASC, id ASC`,
        [question.id]
      );

      question.options = options;
    }

    res.json(questions);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve questions",
      error: error.message,
    });
  }
};


module.exports = {
  createQuestion,
  getQuestionsByForm,
};