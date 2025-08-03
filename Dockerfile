# Stage 1: Build the application
FROM python:3.11-slim as builder

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
# Use --target to install dependencies into a specific, non-standard directory
# This makes it easy to copy just the dependencies in the next stage
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the application files
COPY . .

# Stage 2: Create the final production image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the application files and installed dependencies from the builder stage
# This copies everything from the builder's /app directory, including the installed dependencies.
COPY --from=builder /app /app

# The key change: set the PATH to include the Python site-packages directory
# This ensures the shell can find the `gunicorn` executable
# The default path for pip-installed executables in a virtual environment is usually bin.
# For a system-wide install, it's typically /usr/local/bin.
# In python:3.11-slim, it should be in /usr/local/bin. Let's verify and be explicit.

# Add the Gunicorn executable's path to the PATH environment variable
# The python:3.11-slim image should have site-packages in /usr/local/lib/python3.11/site-packages
# The executables are linked to /usr/local/bin.
# Let's add /usr/local/bin to the PATH just to be sure, although it should be there by default.
ENV PATH="/usr/local/bin:$PATH"

# Expose the port
EXPOSE $PORT

# Set environment variables
ENV SESSION_SECRET=a_secure_default_secret
ENV FLASK_APP=app.py

# Use Gunicorn to run the application
# Use the "shell" form with `exec` to ensure robust path resolution
# Or, keep the exec form but make sure the path is correct.
# Let's stick with the exec form and verify the path.
# Your original CMD command is actually correct for the exec form. The issue is the PATH.
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]
