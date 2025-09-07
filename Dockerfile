FROM docker.io/library/python:latest
WORKDIR /opt
COPY TransHistory TransProject static templates db.sqlite3 manage.py /opt/
RUN python3 -m pip install --no-cache-dir asgiref==3.9.1 Django==5.2.5 sqlparse==0.5.3 tzdata==2025.2
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
