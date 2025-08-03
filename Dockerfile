# Use a single-stage build to ensure all dependencies are in the final image.
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies first.
# This optimizes Docker's layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE $PORT

# Set environment variables
ENV SESSION_SECRET=a_secure_default_secret
ENV FLASK_APP=app.py

# Use Gunicorn to run the application
# This CMD is correct. The issue was the missing executable, not the command itself.
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]
