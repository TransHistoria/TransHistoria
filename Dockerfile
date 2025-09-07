FROM docker.io/library/python:latest
WORKDIR /opt
COPY . /opt/
RUN python3 -m pip install --no-cache-dir -r requirements.txt
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]