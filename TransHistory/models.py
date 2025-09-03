from django.db import models

# Create your models here.
class HistoryNode(models.Model):
    title = models.CharField(max_length=255)
    con = models.TextField()
    ref = models.JSONField(default=list)
    time = models.CharField(max_length=100, blank=True)
    field = models.CharField(max_length=100, blank=True)
    theme = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    tag = models.CharField(max_length=50, blank=True)
    oridoc = models.FileField(upload_to='uploads/', blank=True, null=True)
    mkdoc = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title