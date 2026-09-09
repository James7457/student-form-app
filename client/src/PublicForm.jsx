import { useEffect, useState } from "react";

function PublicForm({ formId }) {
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* =========================================
     LOAD PUBLIC FORM
  ========================================= */

  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/forms/public/${formId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load form."
          );
        }

        setForm(data);

      } catch (error) {
        console.error(error);

        setMessage(
          error.message || "Failed to load form."
        );
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);


  /* =========================================
     NORMAL ANSWERS
  ========================================= */

  const handleAnswerChange = (
    questionId,
    value
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };


  /* =========================================
     CHECKBOX
  ========================================= */

  const handleCheckboxChange = (
    questionId,
    option,
    checked
  ) => {
    setAnswers((previous) => {

      const current =
        previous[questionId] || [];

      if (checked) {
        return {
          ...previous,
          [questionId]: [
            ...current,
            option,
          ],
        };
      }

      return {
        ...previous,
        [questionId]:
          current.filter(
            (item) => item !== option
          ),
      };
    });
  };


  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit = async () => {

    setMessage("");

    /* Validate required questions */

    for (
      const question of form.questions
    ) {

      if (!question.required) {
        continue;
      }

      const answer =
        answers[question.id];

      if (
        answer === undefined ||
        answer === "" ||
        (
          Array.isArray(answer) &&
          answer.length === 0
        )
      ) {

        setMessage(
          `Please answer Question ${
            form.questions.indexOf(question) + 1
          }.`
        );

        return;
      }
    }


    try {

      setSubmitting(true);

      const formattedAnswers =
        form.questions.map(
          (question) => {

            const answer =
              answers[question.id];

            return {
              question_id:
                question.id,

              answer_text:
                Array.isArray(answer)
                  ? answer.join(", ")
                  : answer || "",
            };
          }
        );


      const response = await fetch(
        "http://localhost:5000/api/responses",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            form_id: form.id,
            answers: formattedAnswers,
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit form."
        );
      }


      setMessage(
        "Form submitted successfully!"
      );

      setAnswers({});


    } catch (error) {

      console.error(error);

      setMessage(
        error.message ||
          "Failed to submit form."
      );

    } finally {

      setSubmitting(false);

    }
  };


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="public-form-page">
        <div className="public-form-container">
          <h2>Loading form...</h2>
        </div>
      </div>
    );
  }


  /* =========================================
     ERROR
  ========================================= */

  if (!form) {
    return (
      <div className="public-form-page">
        <div className="public-form-container">
          <h2>Unable to load form</h2>

          <p>{message}</p>
        </div>
      </div>
    );
  }


  /* =========================================
     FORM
  ========================================= */

  return (

    <div className="public-form-page">

      <div className="public-form-container">

        {/* HEADER */}

        <div className="public-form-header">

          <h1>
            {form.title}
          </h1>

          {form.description && (
            <p>
              {form.description}
            </p>
          )}

        </div>


        {/* QUESTIONS */}

        <div className="public-form-questions">

          {form.questions.map(
            (question, index) => (

              <div
                className="public-question"
                key={question.id}
              >

                <label className="public-question-title">

                  {index + 1}.{" "}

                  {question.question_text}

                  {question.required && (
                    <span className="required-star">
                      *
                    </span>
                  )}

                </label>


                {/* SHORT ANSWER */}

                {question.question_type ===
                  "text" && (

                  <input
                    type="text"
                    className="public-input"
                    placeholder="Your answer"

                    value={
                      answers[
                        question.id
                      ] || ""
                    }

                    onChange={(event) =>
                      handleAnswerChange(
                        question.id,
                        event.target.value
                      )
                    }
                  />

                )}


                {/* MULTIPLE CHOICE */}

                {question.question_type ===
                  "multiple_choice" && (

                  <div className="public-options">

                    {question.options.map(
                      (option) => (

                        <label
                          key={option.id}
                        >

                          <input
                            type="radio"

                            name={`question-${question.id}`}

                            value={
                              option.option_text
                            }

                            checked={
                              answers[
                                question.id
                              ] ===
                              option.option_text
                            }

                            onChange={() =>
                              handleAnswerChange(
                                question.id,
                                option.option_text
                              )
                            }
                          />

                          <span>
                            {option.option_text}
                          </span>

                        </label>

                      )
                    )}

                  </div>

                )}


                {/* CHECKBOX */}

                {question.question_type ===
                  "checkbox" && (

                  <div className="public-options">

                    {question.options.map(
                      (option) => {

                        const selected =
                          answers[
                            question.id
                          ] || [];

                        return (

                          <label
                            key={option.id}
                          >

                            <input
                              type="checkbox"

                              checked={selected.includes(
                                option.option_text
                              )}

                              onChange={(event) =>
                                handleCheckboxChange(
                                  question.id,
                                  option.option_text,
                                  event.target.checked
                                )
                              }
                            />

                            <span>
                              {option.option_text}
                            </span>

                          </label>

                        );
                      }
                    )}

                  </div>

                )}


                {/* DROPDOWN */}

                {question.question_type ===
                  "dropdown" && (

                  <select
                    className="public-input"

                    value={
                      answers[
                        question.id
                      ] || ""
                    }

                    onChange={(event) =>
                      handleAnswerChange(
                        question.id,
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select an option
                    </option>

                    {question.options.map(
                      (option) => (

                        <option
                          key={option.id}
                          value={
                            option.option_text
                          }
                        >
                          {option.option_text}
                        </option>

                      )
                    )}

                  </select>

                )}

              </div>

            )
          )}

        </div>


        {/* SUBMIT */}

        <button
          className="public-submit-button"
          onClick={handleSubmit}
          disabled={submitting}
        >

          {submitting
            ? "Submitting..."
            : "Submit Form"}

        </button>


        {/* MESSAGE */}

        {message && (

          <div className="public-message">
            {message}
          </div>

        )}

      </div>

    </div>

  );
}

export default PublicForm;