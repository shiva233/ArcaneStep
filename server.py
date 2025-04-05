from flask import Flask, request
import os

app = Flask(__name__)

# Variable to store the number of steps
number_of_steps = 0
file_path = "steps.txt"  # File where step data will be saved


@app.route("/webhook", methods=["POST"])
def handle_webhook():
    global number_of_steps

    # Print the entire form data to the terminal for debugging
    # print("Received data:", request.form)

    # Retrieve the 'steps' field from the form data
    if "steps" in request.form:
        number_of_steps = int(request.form["steps"])

        # Write the step data to the file
        with open(file_path, "w") as f:
            f.write(str(number_of_steps))

        return f"Received step data: {number_of_steps}", 200
    else:
        return "No step data found", 400


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
