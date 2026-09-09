import { useState } from "react";

import FormBuilder from "./FormBuilder";

import PublicForm from "./PublicForm";

import Responses from "./responses";

import "./App.css";

function App() {
  const [page, setPage] = useState("builder");

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    questions: [],
  });

  // Check if this is a public form URL
  const path = window.location.pathname;

  const publicFormMatch =
    path.match(/^\/form\/(\d+)\/?$/);

  // If URL is /form/ID, show the public form
  if (publicFormMatch) {
    return (
      <PublicForm
        formId={publicFormMatch[1]}
      />
    );
  }

  // Update form
  const handleFormUpdate = (updatedForm) => {
    setForm(updatedForm);
  };

  // Public link
  const publicLink = form.id
    ? `${window.location.origin}/form/${form.id}`
    : "";

  // Copy public link
  const handleCopyLink = async () => {
    if (!publicLink) {
      alert("Create the form first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        publicLink
      );

      alert(
        "Public link copied successfully!"
      );
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      alert(
        "Unable to copy the link."
      );
    }
  };

  // Open public form
  const handleOpenPublicForm = () => {
    if (!publicLink) {
      alert("Create the form first.");
      return;
    }

    window.open(
      publicLink,
      "_blank"
    );
  };

  return (
    <div className="app">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <nav className="app-nav">

        <div className="nav-logo">
          Student Form App
        </div>

        <div className="nav-links">

          {/* FORM BUILDER */}

          <button
            type="button"
            className={
              page === "builder"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("builder")
            }
          >
            Form Builder
          </button>


          {/* PREVIEW */}

          <button
            type="button"
            className={
              page === "preview"
                ? "active"
                : ""
            }
            onClick={() =>
              setPage("preview")
            }
          >
            Preview
          </button>


          {/* RESPONSES */}

          <button
            type="button"
            className={
              page === "responses"
                ? "active"
                : ""
            }
            onClick={() => {

              if (!form.id) {
                alert(
                  "Create and save a form first."
                );

                return;
              }

              setPage("responses");
            }}
          >
            📊 View Responses
          </button>

        </div>

      </nav>


      {/* =====================================
          FORM BUILDER
      ===================================== */}

      {page === "builder" && (

        <FormBuilder
          form={form}
          setForm={handleFormUpdate}
        />

      )}


      {/* =====================================
          PREVIEW
      ===================================== */}

      {page === "preview" && (

        <div className="preview-page">

          <div className="preview-container">

            <h1>
              {form.title ||
                "Untitled Form"}
            </h1>


            {form.description && (

              <p className="preview-description">
                {form.description}
              </p>

            )}


            {form.questions.length === 0 ? (

              <div className="empty-preview">

                <h2>
                  No questions yet
                </h2>

                <p>
                  Go back to Form Builder
                  and add questions.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setPage("builder")
                  }
                >
                  Back to Builder
                </button>

              </div>

            ) : (

              <div className="preview-questions">

                {form.questions.map(
                  (question, index) => (

                    <div
                      className="preview-question"
                      key={
                        question.id ||
                        index
                      }
                    >

                      <div className="preview-question-title">

                        <span>
                          {index + 1}.
                        </span>

                        <span>
                          {question.question_text}
                        </span>

                        {question.required && (

                          <span className="required-star">
                            *
                          </span>

                        )}

                      </div>


                      {/* TEXT */}

                      {question.question_type ===
                        "text" && (

                        <input
                          type="text"
                          className="preview-input"
                          placeholder="Your answer"
                        />

                      )}


                      {/* MULTIPLE CHOICE */}

                      {question.question_type ===
                        "multiple_choice" && (

                        <div className="preview-options">

                          {(question.options ||
                            []).map(
                              (
                                option,
                                optionIndex
                              ) => (

                                <label
                                  key={
                                    optionIndex
                                  }
                                  className="preview-option"
                                >

                                  <input
                                    type="radio"
                                    name={
                                      `question-${
                                        question.id ||
                                        index
                                      }`
                                    }
                                  />

                                  <span>
                                    {option}
                                  </span>

                                </label>

                              )
                            )}

                        </div>

                      )}


                      {/* CHECKBOX */}

                      {question.question_type ===
                        "checkbox" && (

                        <div className="preview-options">

                          {(question.options ||
                            []).map(
                              (
                                option,
                                optionIndex
                              ) => (

                                <label
                                  key={
                                    optionIndex
                                  }
                                  className="preview-option"
                                >

                                  <input
                                    type="checkbox"
                                  />

                                  <span>
                                    {option}
                                  </span>

                                </label>

                              )
                            )}

                        </div>

                      )}


                      {/* DROPDOWN */}

                      {question.question_type ===
                        "dropdown" && (

                        <select className="preview-input">

                          <option value="">
                            Select an option
                          </option>

                          {(question.options ||
                            []).map(
                              (
                                option,
                                optionIndex
                              ) => (

                                <option
                                  key={
                                    optionIndex
                                  }
                                  value={
                                    option
                                  }
                                >
                                  {option}
                                </option>

                              )
                            )}

                        </select>

                      )}

                    </div>

                  )
                )}


                <button
                  type="button"
                  className="submit-preview-button"
                  onClick={() =>
                    alert(
                      "Preview mode only. Open the Public Form to submit responses."
                    )
                  }
                >
                  Submit Form
                </button>

              </div>

            )}

          </div>

        </div>

      )}


      {/* =====================================
          RESPONSES
      ===================================== */}

      {page === "responses" && (

        <Responses
          formId={form.id}
          onBack={() =>
            setPage("builder")
          }
        />

      )}


      {/* =====================================
          PUBLIC LINK
      ===================================== */}

      {form.id && (

        <div className="public-link-wrapper">

          <div className="public-link-card">

            <h2>
              Public Form Link
            </h2>

            <p>
              Share this link with your respondents.
            </p>


            <div className="public-link-row">

              <input
                type="text"
                value={publicLink}
                readOnly
              />


              <button
                type="button"
                onClick={
                  handleCopyLink
                }
              >
                Copy Link
              </button>

            </div>


            <button
              type="button"
              className="open-public-button"
              onClick={
                handleOpenPublicForm
              }
            >
              Open Public Form
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;