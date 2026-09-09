import { useState } from "react";

function FormBuilder({ form, setForm }) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState([""]);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const optionBasedTypes = [
    "multiple_choice",
    "checkbox",
    "dropdown",
  ];

  /* =========================================
     QUESTION TYPE
  ========================================= */

  const handleQuestionTypeChange = (event) => {
    const type = event.target.value;

    setQuestionType(type);

    if (optionBasedTypes.includes(type)) {
      if (options.length === 0) {
        setOptions([""]);
      }
    } else {
      setOptions([""]);
    }
  };

  /* =========================================
     OPTIONS
  ========================================= */

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];

    updatedOptions[index] = value;

    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length === 1) {
      return;
    }

    setOptions(
      options.filter(
        (_, optionIndex) => optionIndex !== index
      )
    );
  };

  /* =========================================
     RESET QUESTION BUILDER
  ========================================= */

  const resetQuestionBuilder = () => {
    setQuestionText("");
    setQuestionType("text");
    setRequired(false);
    setOptions([""]);
    setEditingId(null);
    setMessage("");
  };

  /* =========================================
     ADD QUESTION
  ========================================= */

  const handleAddQuestion = async () => {
    setMessage("");

    if (!form.title || !form.title.trim()) {
      setMessage("Please enter a form title.");
      return;
    }

    if (!questionText.trim()) {
      setMessage("Please enter a question.");
      return;
    }

    if (optionBasedTypes.includes(questionType)) {
      const validOptions = options.filter(
        (option) => option.trim() !== ""
      );

      if (validOptions.length < 2) {
        setMessage(
          "Please add at least two options."
        );
        return;
      }
    }

    try {
      setSaving(true);

      /* =========================================
         QUESTION ORDER
      ========================================= */

      const questionOrder =
        form.questions.length + 1;

      /* =========================================
         FORM ID
      ========================================= */

      let currentFormId = form.id;

      /* =========================================
         CREATE FORM IF IT DOES NOT EXIST
      ========================================= */

      if (!currentFormId) {
        const formResponse = await fetch(
          "https://student-form-app-l2yr.onrender.com/api/forms",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              user_id: 1,
              title: form.title,
              description: form.description,
            }),
          }
        );

        const formData =
          await formResponse.json();

        if (!formResponse.ok) {
          throw new Error(
            formData.message ||
              "Failed to create form."
          );
        }

        currentFormId =
          formData.form_id ||
          formData.id ||
          formData.insertId;

        if (!currentFormId) {
          throw new Error(
            "Form was created but no form ID was returned."
          );
        }

        setForm({
          ...form,
          id: currentFormId,
        });
      }

      /* =========================================
         CREATE QUESTION
      ========================================= */

      const questionResponse = await fetch(
        "https://student-form-app-l2yr.onrender.com/api/questions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            form_id: currentFormId,
            question_text: questionText,
            question_type: questionType,
            required: required,
            question_order: questionOrder,
          }),
        }
      );

      const questionData =
        await questionResponse.json();

      if (!questionResponse.ok) {
        throw new Error(
          questionData.message ||
            "Failed to create question."
        );
      }

      /* =========================================
         QUESTION ID
      ========================================= */

      const questionId =
        questionData.question_id ||
        questionData.id ||
        questionData.insertId;

      if (!questionId) {
        throw new Error(
          "Question was created but no question ID was returned."
        );
      }

      /* =========================================
         CREATE OPTIONS
      ========================================= */

      let savedOptions = [];

      if (optionBasedTypes.includes(questionType)) {
        const validOptions = options.filter(
          (option) => option.trim() !== ""
        );

        for (const [optionIndex, option] of validOptions.entries()) {
          const optionResponse = await fetch(
            "https://student-form-app-l2yr.onrender.com/api/options",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                question_id: questionId,
                option_text: option,
                option_order: optionIndex + 1,
              }),
            }
          );

          const optionData =
            await optionResponse.json();

          if (!optionResponse.ok) {
            throw new Error(
              optionData.message ||
                "Failed to create option."
            );
          }

          savedOptions.push({
            option_text: option,
          });
        }
      }

      /* =========================================
         NEW QUESTION
      ========================================= */

      const newQuestion = {
        id: questionId,
        question_text: questionText,
        question_type: questionType,
        required: required,
        options: savedOptions,
      };

      /* =========================================
         UPDATE FORM STATE
      ========================================= */

      setForm({
        ...form,
        id: currentFormId,
        questions: [
          ...form.questions,
          newQuestion,
        ],
      });

      setMessage(
        "Question added successfully!"
      );

      /* =========================================
         RESET FOR NEXT QUESTION
      ========================================= */

      setQuestionText("");
      setQuestionType("text");
      setRequired(false);
      setOptions([""]);
      setEditingId(null);

    } catch (error) {
      console.error(
        "Error adding question:",
        error
      );

      setMessage(
        error.message ||
          "Failed to create question."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     START EDITING
  ========================================= */

  const handleEditQuestion = (question) => {
    setEditingId(question.id);

    setQuestionText(
      question.question_text
    );

    setQuestionType(
      question.question_type
    );

    setRequired(
      question.required
    );

    setOptions(
      question.options &&
        question.options.length > 0
        ? question.options.map((option) =>
            typeof option === "string"
              ? option
              : option.option_text
          )
        : [""]
    );

    setMessage(
      "You are editing this question."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================
     DELETE QUESTION
  ========================================= */

  const handleDeleteQuestion = async (
    questionId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `https://student-form-app-l2yr.onrender.com/api/questions/${questionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete question."
        );
      }

      const updatedQuestions =
        form.questions.filter(
          (question) =>
            question.id !== questionId
        );

      setForm({
        ...form,
        questions: updatedQuestions,
      });

      if (editingId === questionId) {
        resetQuestionBuilder();
      }

      setMessage(
        "Question deleted successfully."
      );

    } catch (error) {
      console.error(
        "Delete question error:",
        error
      );

      setMessage(
        error.message ||
          "Failed to delete question."
      );
    }
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="builder-page">

      <div className="builder-container">

        <h1>
          Create Your Form
        </h1>

        <p className="builder-description">
          Build your form by creating questions,
          choosing question types, and deciding
          which questions are required.
        </p>

        {/* =====================================
            FORM INFORMATION
        ===================================== */}

        <div className="builder-card">

          <label>
            Form title
          </label>

          <input
            type="text"
            placeholder="Enter your form title"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
          />

          <label>
            Form description
          </label>

          <textarea
            placeholder="Enter a description for your form"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
          />

        </div>

        {/* =====================================
            EXISTING QUESTIONS
        ===================================== */}

        {form.questions.length > 0 && (
          <div className="builder-card">

            <h2>
              Your Questions
            </h2>

            {form.questions.map(
              (question, index) => (
                <div
                  className="saved-question"
                  key={question.id || index}
                >

                  <div className="saved-question-header">

                    <strong>
                      Question {index + 1}
                    </strong>

                    <span>
                      {question.required
                        ? "Required"
                        : "Optional"}
                    </span>

                  </div>

                  <p>
                    {question.question_text}
                  </p>

                  <small>
                    {question.question_type ===
                      "text" &&
                      "Short answer"}

                    {question.question_type ===
                      "multiple_choice" &&
                      "Multiple choice"}

                    {question.question_type ===
                      "checkbox" &&
                      "Checkboxes"}

                    {question.question_type ===
                      "dropdown" &&
                      "Dropdown"}
                  </small>

                  {/* OPTIONS */}

                  {question.options &&
                    question.options.length >
                      0 && (
                    <ul>
                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => (
                          <li
                            key={
                              option.id ||
                              optionIndex
                            }
                          >
                            {typeof option === "string"
                              ? option
                              : option.option_text}
                          </li>
                        )
                      )}
                    </ul>
                  )}

                  {/* ACTION BUTTONS */}

                  <div className="question-actions">

                    <button
                      type="button"
                      className="edit-question-button"
                      onClick={() =>
                        handleEditQuestion(
                          question
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-question-button"
                      onClick={() =>
                        handleDeleteQuestion(
                          question.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

        {/* =====================================
            QUESTION BUILDER
        ===================================== */}

        <div className="builder-card">

          <h2>
            {editingId
              ? "Edit Question"
              : "Add Question"}
          </h2>

          <input
            type="text"
            className="question-input"
            placeholder="Type your question here..."
            value={questionText}
            onChange={(event) =>
              setQuestionText(
                event.target.value
              )
            }
          />

          {/* QUESTION TYPE */}

          <label>
            Question type
          </label>

          <select
            value={questionType}
            onChange={
              handleQuestionTypeChange
            }
          >

            <option value="text">
              Short answer
            </option>

            <option value="multiple_choice">
              Multiple choice
            </option>

            <option value="checkbox">
              Checkboxes
            </option>

            <option value="dropdown">
              Dropdown
            </option>

          </select>

          {/* OPTIONS */}

          {optionBasedTypes.includes(
            questionType
          ) && (
            <div className="options-builder">

              <h3>
                Options
              </h3>

              {options.map(
                (option, index) => (
                  <div
                    className="builder-option"
                    key={index}
                  >

                    <span>
                      {questionType ===
                      "multiple_choice"
                        ? "○"
                        : questionType ===
                          "checkbox"
                        ? "☐"
                        : `${index + 1}.`}
                    </span>

                    <input
                      type="text"
                      placeholder={`Option ${
                        index + 1
                      }`}
                      value={option}
                      onChange={(event) =>
                        handleOptionChange(
                          index,
                          event.target.value
                        )
                      }
                    />

                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeOption(index)
                        }
                      >
                        Remove
                      </button>
                    )}

                  </div>
                )
              )}

              <button
                type="button"
                className="add-option-button"
                onClick={addOption}
              >
                + Add option
              </button>

            </div>
          )}

          {/* REQUIRED */}

          <div className="required-row">

            <span>
              Required
            </span>

            <label className="switch">

              <input
                type="checkbox"
                checked={required}
                onChange={(event) =>
                  setRequired(
                    event.target.checked
                  )
                }
              />

              <span className="slider"></span>

            </label>

            <span>
              {required
                ? "ON"
                : "OFF"}
            </span>

          </div>

          {/* ACTION BUTTONS */}

          <div className="question-builder-actions">

            <button
              type="button"
              className="add-question-button"
              onClick={
                handleAddQuestion
              }
              disabled={
                saving || editingId
              }
            >
              {saving
                ? "Adding..."
                : "+ Add Question"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-edit-button"
                onClick={
                  resetQuestionBuilder
                }
              >
                Cancel Edit
              </button>
            )}

          </div>

          {message && (
            <p className="builder-message">
              {message}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default FormBuilder;