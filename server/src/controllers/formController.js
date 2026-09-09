const db = require("../config/db");


/* =========================================
   CREATE FORM
   ========================================= */

const createForm = async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
    } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({
        message:
          "user_id and title are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO forms
      (user_id, title, description)
      VALUES (?, ?, ?)`,
      [
        user_id,
        title,
        description || null,
      ]
    );

    res.status(201).json({
      message:
        "Form created successfully",
      form_id: result.insertId,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to create form",
      error: error.message,
    });

  }
};


/* =========================================
   GET ALL FORMS
   ========================================= */

const getForms = async (req, res) => {
  try {

    const [forms] = await db.query(
      `SELECT * FROM forms
       ORDER BY created_at DESC`
    );

    res.json(forms);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Failed to retrieve forms",
      error: error.message,
    });

  }
};


/* =========================================
   GET FORM BY ID
   ========================================= */

const getFormById = async (req, res) => {
  try {

    const { id } = req.params;

    const [forms] = await db.query(
      `SELECT * FROM forms
       WHERE id = ?`,
      [id]
    );

    if (forms.length === 0) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    res.json(forms[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Failed to retrieve form",
      error: error.message,
    });

  }
};


/* =========================================
   GET PUBLIC FORM
   ========================================= */

const getPublicForm = async (req, res) => {
  try {

    const { id } = req.params;

    /* Get form */

    const [forms] = await db.query(
      `SELECT
        id,
        title,
        description
       FROM forms
       WHERE id = ?`,
      [id]
    );

    if (forms.length === 0) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const form = forms[0];

    /* Get questions */

    const [questions] = await db.query(
      `SELECT
        id,
        question_text,
        question_type,
        required,
        question_order
       FROM questions
       WHERE form_id = ?
       ORDER BY question_order ASC, id ASC`,
      [id]
    );


    /* Get options */

    for (const question of questions) {

      if (
        question.question_type ===
          "multiple_choice" ||
        question.question_type ===
          "checkbox" ||
        question.question_type ===
          "dropdown"
      ) {

        const [options] =
          await db.query(
            `SELECT
              id,
              option_text,
              option_order
             FROM options
             WHERE question_id = ?
             ORDER BY option_order ASC, id ASC`,
            [question.id]
          );

        question.options = options;

      } else {

        question.options = [];

      }

    }


    /* Return complete public form */

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: questions,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Failed to retrieve public form",
      error: error.message,
    });

  }
};


module.exports = {
  createForm,
  getForms,
  getFormById,
  getPublicForm,
};