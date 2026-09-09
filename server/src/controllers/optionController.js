const db = require("../config/db");

const createOption = async (req, res) => {
  try {
    const {
      question_id,
      option_text,
      option_order,
    } = req.body;

    if (!question_id || !option_text) {
      return res.status(400).json({
        message: "question_id and option_text are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO options
      (question_id, option_text, option_order)
      VALUES (?, ?, ?)`,
      [
        question_id,
        option_text,
        option_order || 0,
      ]
    );

    res.status(201).json({
      message: "Option created successfully",
      option_id: result.insertId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create option",
      error: error.message,
    });
  }
};


const getOptionsByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const [options] = await db.query(
      `SELECT * FROM options
       WHERE question_id = ?
       ORDER BY option_order ASC`,
      [questionId]
    );

    res.json(options);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve options",
      error: error.message,
    });
  }
};


/* =========================================
   REPLACE ALL OPTIONS FOR A QUESTION
   ========================================= */

const replaceOptions = async (req, res) => {
  let connection;

  try {
    const { questionId } = req.params;
    const { options } = req.body;

    if (!Array.isArray(options)) {
      return res.status(400).json({
        message: "options must be an array",
      });
    }

    const validOptions = options
      .filter(
        (option) =>
          typeof option === "string" &&
          option.trim() !== ""
      )
      .map((option) => option.trim());

    if (validOptions.length < 2) {
      return res.status(400).json({
        message:
          "At least two valid options are required",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    /* Delete old options */

    await connection.query(
      `DELETE FROM options
       WHERE question_id = ?`,
      [questionId]
    );

    /* Insert new options */

    for (
      let i = 0;
      i < validOptions.length;
      i++
    ) {
      await connection.query(
        `INSERT INTO options
        (question_id, option_text, option_order)
        VALUES (?, ?, ?)`,
        [
          questionId,
          validOptions[i],
          i + 1,
        ]
      );
    }

    await connection.commit();

    res.json({
      message: "Options updated successfully",
      question_id: questionId,
      options: validOptions,
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to update options",
      error: error.message,
    });

  } finally {

    if (connection) {
      connection.release();
    }

  }
};


module.exports = {
  createOption,
  getOptionsByQuestion,
  replaceOptions,
};