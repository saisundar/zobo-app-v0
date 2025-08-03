# Stage 1: Build the application
FROM python:3.11-slim as builder

# Set the working directory
WORKDIR /app

# Copy and install dependencies
# We assume requirements.txt is in the root of the repo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the application files
# This ensures templates/, static/, app.py, and calendar_service.py are included.
COPY . .

# Stage 2: Create the final production image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the application files and installed dependencies from the builder stage
COPY --from=builder /app /app

# Expose the port
EXPOSE $PORT

# Set environment variables
# These are the variables from replit.md
ENV SESSION_SECRET=a_secure_default_secret
ENV FLASK_APP=app.py

# Use Gunicorn to run the application
# This command is the production-ready entry point.
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]
