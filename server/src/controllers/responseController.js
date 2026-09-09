const db = require("../config/db");


/* =========================================
   SUBMIT RESPONSE
========================================= */

const submitResponse = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { form_id, answers } = req.body;

    if (!form_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "form_id and answers are required",
      });
    }

    await connection.beginTransaction();

    /* =========================================
       CREATE RESPONSE
    ========================================= */

    const [responseResult] = await connection.query(
      `INSERT INTO responses (form_id)
       VALUES (?)`,
      [form_id]
    );

    const responseId = responseResult.insertId;

    /* =========================================
       SAVE ANSWERS
    ========================================= */

    for (const answer of answers) {
      await connection.query(
        `INSERT INTO answers
        (response_id, question_id, answer_text)
        VALUES (?, ?, ?)`,
        [
          responseId,
          answer.question_id,
          answer.answer_text,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Response submitted successfully",
      response_id: responseId,
    });

  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Failed to submit response",
      error: error.message,
    });

  } finally {
    connection.release();
  }
};


/* =========================================
   GET RESPONSES FOR A FORM
========================================= */

const getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({
        message: "formId is required",
      });
    }


    /* =========================================
       GET FORM
    ========================================= */

    const [forms] = await db.query(
      `SELECT
          id,
          title,
          description
       FROM forms
       WHERE id = ?`,
      [formId]
    );

    if (forms.length === 0) {
      return res.status(404).json({
        message: "Form not found",
      });
    }


    /* =========================================
       GET QUESTIONS
    ========================================= */

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
      [formId]
    );


    /* =========================================
       GET RESPONSES

       IMPORTANT:
       Your database uses submitted_at,
       NOT created_at.
    ========================================= */

    const [responses] = await db.query(
      `SELECT
          id,
          form_id,
          submitted_at
       FROM responses
       WHERE form_id = ?
       ORDER BY id DESC`,
      [formId]
    );


    /* =========================================
       GET ANSWERS
    ========================================= */

    let answers = [];

    const responseIds = responses.map(
      (response) => response.id
    );

    if (responseIds.length > 0) {

      const placeholders = responseIds
        .map(() => "?")
        .join(",");

      const [answerRows] = await db.query(
        `SELECT
            id,
            response_id,
            question_id,
            answer_text
         FROM answers
         WHERE response_id IN (${placeholders})
         ORDER BY id ASC`,
        responseIds
      );

      answers = answerRows;
    }


    /* =========================================
       FORMAT RESPONSES
    ========================================= */

    const formattedResponses =
      responses.map((response) => {

        const responseAnswers =
          answers.filter(
            (answer) =>
              answer.response_id === response.id
          );

        return {
          id: response.id,

          form_id: response.form_id,

          submitted_at:
            response.submitted_at,

          answers: responseAnswers,
        };
      });


    /* =========================================
       SEND RESPONSE
    ========================================= */

    res.json({
      form: forms[0],

      questions: questions,

      responses: formattedResponses,

      total_responses:
        formattedResponses.length,
    });

  } catch (error) {

    console.error(
      "Get form responses error:",
      error
    );

    res.status(500).json({
      message: "Failed to get responses",
      error: error.message,
    });
  }
};


/* =========================================
   EXPORT RESPONSES AS CSV
========================================= */

const exportResponsesCSV = async (req, res) => {
  try {

    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({
        message: "formId is required",
      });
    }


    /* =========================================
       GET FORM
    ========================================= */

    const [forms] = await db.query(
      `SELECT
          id,
          title
       FROM forms
       WHERE id = ?`,
      [formId]
    );

    if (forms.length === 0) {
      return res.status(404).json({
        message: "Form not found",
      });
    }


    /* =========================================
       GET QUESTIONS
    ========================================= */

    const [questions] = await db.query(
      `SELECT
          id,
          question_text,
          question_order
       FROM questions
       WHERE form_id = ?
       ORDER BY question_order ASC, id ASC`,
      [formId]
    );


    /* =========================================
       GET RESPONSES AND ANSWERS
       
       IMPORTANT:
       Your database uses submitted_at.
    ========================================= */

    const [rows] = await db.query(
      `SELECT
          r.id AS response_id,
          r.submitted_at,
          a.question_id,
          a.answer_text
       FROM responses r
       LEFT JOIN answers a
         ON r.id = a.response_id
       WHERE r.form_id = ?
       ORDER BY r.id ASC, a.id ASC`,
      [formId]
    );


    /* =========================================
       CSV ESCAPE FUNCTION
    ========================================= */

    const escapeCSV = (value) => {

      if (
        value === null ||
        value === undefined
      ) {
        return "";
      }

      const text = String(value);

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    };


    /* =========================================
       CSV HEADERS
    ========================================= */

    const headers = [
      "Response ID",
      "Submitted At",

      ...questions.map(
        (question) =>
          question.question_text
      ),
    ];


    const csvRows = [];


    /* =========================================
       ADD HEADER
    ========================================= */

    csvRows.push(
      headers
        .map(escapeCSV)
        .join(",")
    );


    /* =========================================
       ORGANIZE RESPONSES
    ========================================= */

    const responseMap = {};


    for (const row of rows) {

      if (!responseMap[row.response_id]) {

        responseMap[row.response_id] = {

          response_id:
            row.response_id,

          submitted_at:
            row.submitted_at,

          answers: {},
        };
      }


      if (row.question_id) {

        responseMap[
          row.response_id
        ].answers[
          row.question_id
        ] = row.answer_text;
      }
    }


    /* =========================================
       CREATE CSV DATA ROWS
    ========================================= */

    for (
      const responseId
      of Object.keys(responseMap)
    ) {

      const response =
        responseMap[responseId];


      const row = [

        response.response_id,

        response.submitted_at,
      ];


      for (const question of questions) {

        row.push(
          response.answers[
            question.id
          ] || ""
        );
      }


      csvRows.push(
        row
          .map(escapeCSV)
          .join(",")
      );
    }


    /* =========================================
       SAFE FILE NAME
    ========================================= */

    const safeTitle =
      String(
        forms[0].title ||
          "form"
      )
        .replace(
          /[^a-z0-9]/gi,
          "_"
        )
        .replace(
          /_+/g,
          "_"
        );


    const fileName =
      `${safeTitle}_responses.csv`;


    /* =========================================
       SEND CSV FILE
    ========================================= */

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );


    res.send(
      "\uFEFF" +
      csvRows.join("\n")
    );

  } catch (error) {

    console.error(
      "Export CSV error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to export responses",

      error:
        error.message,
    });
  }
};


/* =========================================
   EXPORT CONTROLLERS
========================================= */

module.exports = {

  submitResponse,

  getFormResponses,

  exportResponsesCSV,

};